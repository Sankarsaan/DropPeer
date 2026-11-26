"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { computeFileSHA256, computeSafetyEmojis } from "@/lib/crypto";

export type ConnectionStatus =
  | "waiting"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "room-full";

export interface WireTextMessage {
  type: "text";
  id: string;
  content: string;
  timestamp: number;
}

export interface WireFileMetaMessage {
  type: "file-meta";
  id: string;
  name: string;
  size: number;
  mimeType: string;
  sha256: string;
}

export interface WireFileCompleteMessage {
  type: "file-complete";
  id: string;
}

type WireControlMessage =
  | WireTextMessage
  | WireFileMetaMessage
  | WireFileCompleteMessage;

export interface TextMessage extends WireTextMessage {
  sender: "self" | "peer";
}

export type TransferDirection = "send" | "receive";
export type TransferStatus =
  | "hashing"
  | "transferring"
  | "verifying"
  | "completed"
  | "failed";

export interface FileTransfer {
  id: string;
  name: string;
  size: number;
  direction: TransferDirection;
  progress: number;
  speedMBps: number;
  status: TransferStatus;
  verified: boolean;
  blobUrl: string | null;
}

interface IncomingFileState {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  sha256: string;
  chunks: ArrayBuffer[];
  receivedBytes: number;
  startedAt: number;
  lastUiUpdateAt: number;
}

type SignalPayload =
  | {
      senderId: string;
      type: "offer" | "answer";
      sdp: RTCSessionDescriptionInit;
    }
  | {
      senderId: string;
      type: "ice-candidate";
      candidate: RTCIceCandidateInit;
    };

interface PresenceEntry {
  peerId: string;
  joinedAt: number;
}

export interface UseWebRTCReturn {
  status: ConnectionStatus;
  safetyEmojis: string[] | null;
  messages: TextMessage[];
  transfers: FileTransfer[];
  sendText: (content: string) => void;
  sendFile: (file: File) => Promise<void>;
  retryConnection: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const CHUNK_SIZE = 16384; // 16 KB
const BUFFER_HIGH_WATERMARK = 1024 * 1024; // 1 MB
const BUFFER_LOW_WATERMARK = 256 * 1024; // 256 KB
const UI_UPDATE_INTERVAL_MS = 100;

function waitForBufferedAmountLow(dc: RTCDataChannel): Promise<void> {
  if (dc.readyState !== "open") {
    return Promise.reject(new Error("DataChannel closed during transfer"));
  }
  if (dc.bufferedAmount <= BUFFER_HIGH_WATERMARK) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      dc.removeEventListener("bufferedamountlow", onLow);
      dc.removeEventListener("close", onClose);
      dc.removeEventListener("error", onError);
    };

    const onLow = () => {
      cleanup();
      resolve();
    };

    const onClose = () => {
      cleanup();
      reject(new Error("DataChannel closed while waiting for backpressure"));
    };

    const onError = () => {
      cleanup();
      reject(new Error("DataChannel error while waiting for backpressure"));
    };

    dc.addEventListener("bufferedamountlow", onLow);
    dc.addEventListener("close", onClose);
    dc.addEventListener("error", onError);
  });
}

export function useWebRTC(roomCode: string): UseWebRTCReturn {
  const [status, setStatus] = useState<ConnectionStatus>("waiting");
  const [safetyEmojis, setSafetyEmojis] = useState<string[] | null>(null);
  const [messages, setMessages] = useState<TextMessage[]>([]);
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const incomingFileRef = useRef<IncomingFileState | null>(null);
  const sendChainRef = useRef<Promise<void>>(Promise.resolve());
  const blobUrlsRef = useRef<string[]>([]);

  const updateTransfer = useCallback(
    (id: string, patch: Partial<FileTransfer>) => {
      setTransfers((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const retryConnection = useCallback(() => {
    setReconnectAttempt((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!roomCode) return;

    let cancelled = false;
    const peerId = crypto.randomUUID();
    const joinedAt = Date.now();
    let hasTracked = false;
    let isRoomFull = false;
    let makingOffer = false;
    let ignoreOffer = false;
    let isSettingRemoteAnswerPending = false;
    let negotiationStartedWithPeer: string | null = null;

    setStatus("waiting");
    setSafetyEmojis(null);
    iceCandidateQueueRef.current = [];
    incomingFileRef.current = null;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    const channel: RealtimeChannel = supabase.channel(`room:${roomCode}`, {
      config: {
        presence: { key: peerId },
        broadcast: { self: false },
      },
    });

    const revokeCreatedBlobUrls = () => {
      for (const url of blobUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      blobUrlsRef.current = [];
    };

    const cleanupResources = () => {
      if (cancelled) return;
      cancelled = true;
      if (dcRef.current) {
        dcRef.current.onopen = null;
        dcRef.current.onclose = null;
        dcRef.current.onmessage = null;
        dcRef.current.close();
        dcRef.current = null;
      }
      pc.ondatachannel = null;
      pc.onicecandidate = null;
      pc.onnegotiationneeded = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.close();
      pcRef.current = null;
      iceCandidateQueueRef.current = [];
      incomingFileRef.current = null;
      revokeCreatedBlobUrls();
      void channel.untrack().catch(() => undefined);
      void supabase.removeChannel(channel);
    };

    const updateSafetyEmojisIfReady = async () => {
      const localSdp = pc.localDescription?.sdp;
      const remoteSdp = pc.remoteDescription?.sdp;
      if (!localSdp || !remoteSdp) return;

      try {
        const emojis = await computeSafetyEmojis(localSdp, remoteSdp);
        if (!cancelled) {
          setSafetyEmojis(emojis);
        }
      } catch (err) {
        console.error("Failed to compute safety emojis:", err);
      }
    };

    const handleControlMessage = async (raw: string) => {
      let parsed: Partial<WireControlMessage>;
      try {
        parsed = JSON.parse(raw) as Partial<WireControlMessage>;
      } catch (err) {
        console.error("Failed to parse DataChannel message:", err);
        return;
      }

      if (
        parsed.type === "text" &&
        typeof parsed.id === "string" &&
        typeof parsed.content === "string" &&
        typeof parsed.timestamp === "number"
      ) {
        setMessages((prev) => [
          ...prev,
          {
            type: "text",
            id: parsed.id as string,
            content: parsed.content as string,
            timestamp: parsed.timestamp as number,
            sender: "peer",
          },
        ]);
        return;
      }

      if (
        parsed.type === "file-meta" &&
        typeof parsed.id === "string" &&
        typeof parsed.name === "string" &&
        typeof parsed.size === "number" &&
        typeof parsed.mimeType === "string" &&
        typeof parsed.sha256 === "string"
      ) {
        incomingFileRef.current = {
          id: parsed.id,
          name: parsed.name,
          size: parsed.size,
          mimeType: parsed.mimeType || "application/octet-stream",
          sha256: parsed.sha256,
          chunks: [],
          receivedBytes: 0,
          startedAt: performance.now(),
          lastUiUpdateAt: 0,
        };

        setTransfers((prev) => [
          ...prev,
          {
            id: parsed.id as string,
            name: parsed.name as string,
            size: parsed.size as number,
            direction: "receive",
            progress: 0,
            speedMBps: 0,
            status: "transferring",
            verified: false,
            blobUrl: null,
          },
        ]);
        return;
      }

      if (parsed.type === "file-complete" && typeof parsed.id === "string") {
        const incoming = incomingFileRef.current;
        if (!incoming || incoming.id !== parsed.id) return;
        incomingFileRef.current = null;

        updateTransfer(incoming.id, {
          progress: 100,
          status: "verifying",
        });

        try {
          const blob = new Blob(incoming.chunks, { type: incoming.mimeType });
          const assembledBuffer = await blob.arrayBuffer();
          const actualSha256 = await computeFileSHA256(assembledBuffer);

          if (cancelled) return;

          if (actualSha256 === incoming.sha256) {
            const blobUrl = URL.createObjectURL(blob);
            blobUrlsRef.current.push(blobUrl);
            updateTransfer(incoming.id, {
              progress: 100,
              status: "completed",
              verified: true,
              blobUrl,
            });
          } else {
            updateTransfer(incoming.id, {
              status: "failed",
              verified: false,
              blobUrl: null,
            });
          }
        } catch (err) {
          console.error("Failed to verify received file:", err);
          if (!cancelled) {
            updateTransfer(incoming.id, {
              status: "failed",
              verified: false,
              blobUrl: null,
            });
          }
        }
      }
    };

    const handleBinaryChunk = (chunk: ArrayBuffer) => {
      const incoming = incomingFileRef.current;
      if (!incoming) return;

      incoming.chunks.push(chunk);
      incoming.receivedBytes += chunk.byteLength;

      const now = performance.now();
      const elapsedSeconds = (now - incoming.startedAt) / 1000;
      const shouldUpdate =
        now - incoming.lastUiUpdateAt >= UI_UPDATE_INTERVAL_MS ||
        incoming.receivedBytes >= incoming.size;

      if (shouldUpdate) {
        incoming.lastUiUpdateAt = now;
        const progress =
          incoming.size > 0
            ? Math.min(
                100,
                Math.round((incoming.receivedBytes / incoming.size) * 100)
              )
            : 100;
        const speedMBps =
          elapsedSeconds > 0
            ? Number(
                (
                  incoming.receivedBytes /
                  (1024 * 1024) /
                  elapsedSeconds
                ).toFixed(2)
              )
            : 0;

        updateTransfer(incoming.id, {
          progress,
          speedMBps,
        });
      }
    };

    const setupDataChannel = (dc: RTCDataChannel) => {
      dc.binaryType = "arraybuffer";
      dc.bufferedAmountLowThreshold = BUFFER_LOW_WATERMARK;
      dcRef.current = dc;

      dc.onopen = () => {
        if (cancelled) return;
        setStatus("connected");
        void updateSafetyEmojisIfReady();
      };

      dc.onclose = () => {
        if (cancelled || isRoomFull) return;
        setStatus("disconnected");
        setSafetyEmojis(null);
      };

      dc.onmessage = (event: MessageEvent) => {
        if (cancelled) return;
        if (typeof event.data === "string") {
          void handleControlMessage(event.data);
        } else if (event.data instanceof ArrayBuffer) {
          handleBinaryChunk(event.data);
        }
      };
    };

    const flushIceCandidates = async () => {
      while (iceCandidateQueueRef.current.length > 0) {
        const candidate = iceCandidateQueueRef.current.shift();
        if (!candidate) continue;
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          if (!ignoreOffer) {
            console.error("Error flushing ICE candidate:", err);
          }
        }
      }
    };

    const sendSignal = async (payload: SignalPayload) => {
      await channel.send({
        type: "broadcast",
        event: "signal",
        payload,
      });
    };

    pc.ondatachannel = (event: RTCDataChannelEvent) => {
      setupDataChannel(event.channel);
    };

    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (cancelled || !event.candidate) return;
      void sendSignal({
        senderId: peerId,
        type: "ice-candidate",
        candidate: event.candidate.toJSON(),
      });
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer = true;
        await pc.setLocalDescription();
        if (!cancelled && pc.localDescription) {
          await sendSignal({
            senderId: peerId,
            type: "offer",
            sdp: pc.localDescription.toJSON(),
          });
        }
      } catch (err) {
        console.error("Error during negotiation:", err);
      } finally {
        makingOffer = false;
      }
    };

    pc.onconnectionstatechange = () => {
      if (cancelled || isRoomFull) return;
      switch (pc.connectionState) {
        case "connecting":
          setStatus("connecting");
          break;
        case "connected":
          setStatus("connected");
          void updateSafetyEmojisIfReady();
          break;
        case "failed":
          setStatus("failed");
          setSafetyEmojis(null);
          break;
        case "disconnected":
        case "closed":
          setStatus("disconnected");
          setSafetyEmojis(null);
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (cancelled || isRoomFull) return;
      if (pc.iceConnectionState === "failed") {
        setStatus("failed");
        setSafetyEmojis(null);
      }
    };

    const rejectAsRoomFull = () => {
      isRoomFull = true;
      setStatus("room-full");
      setSafetyEmojis(null);
      dcRef.current?.close();
      dcRef.current = null;
      pc.close();
      void supabase.removeChannel(channel);
    };

    channel
      .on("presence", { event: "sync" }, () => {
        if (cancelled || isRoomFull) return;

        const state = channel.presenceState<PresenceEntry>();
        const allKeys = Object.keys(state);
        const otherKeys = allKeys.filter((key) => key !== peerId);

        if (!hasTracked) {
          if (otherKeys.length >= 2) {
            rejectAsRoomFull();
            return;
          }
          hasTracked = true;
          void channel.track({ peerId, joinedAt });
          return;
        }

        if (allKeys.length > 2) {
          const ordered = allKeys
            .map((key) => {
              const entry = state[key]?.[0];
              return {
                key,
                joinedAt: entry?.joinedAt ?? Number.MAX_SAFE_INTEGER,
              };
            })
            .sort((a, b) =>
              a.joinedAt !== b.joinedAt
                ? a.joinedAt - b.joinedAt
                : a.key < b.key
                  ? -1
                  : a.key > b.key
                    ? 1
                    : 0
            );

          const allowedKeys = new Set(ordered.slice(0, 2).map((p) => p.key));
          if (!allowedKeys.has(peerId)) {
            rejectAsRoomFull();
            return;
          }
        }

        if (otherKeys.length === 1) {
          const remotePeerId = otherKeys[0];
          if (negotiationStartedWithPeer !== remotePeerId) {
            negotiationStartedWithPeer = remotePeerId;
            if (pc.connectionState !== "connected") {
              setStatus("connecting");
            }
            const isPolite = peerId < remotePeerId;
            if (!isPolite && !dcRef.current) {
              const dc = pc.createDataChannel("droppeer", { ordered: true });
              setupDataChannel(dc);
            }
          }
        } else if (otherKeys.length === 0 && pc.connectionState !== "connected") {
          negotiationStartedWithPeer = null;
          setStatus("waiting");
        }
      })
      .on(
        "broadcast",
        { event: "signal" },
        async ({ payload }: { payload: SignalPayload }) => {
          if (
            cancelled ||
            isRoomFull ||
            !payload ||
            payload.senderId === peerId
          ) {
            return;
          }

          const polite = peerId < payload.senderId;

          if (payload.type === "offer" || payload.type === "answer") {
            try {
              const readyForOffer =
                !makingOffer &&
                (pc.signalingState === "stable" ||
                  isSettingRemoteAnswerPending);
              const offerCollision = payload.type === "offer" && !readyForOffer;

              ignoreOffer = !polite && offerCollision;
              if (ignoreOffer) {
                return;
              }

              isSettingRemoteAnswerPending = payload.type === "answer";
              await pc.setRemoteDescription(payload.sdp);
              isSettingRemoteAnswerPending = false;

              await flushIceCandidates();

              if (payload.type === "offer" && !cancelled) {
                await pc.setLocalDescription();
                if (!cancelled && pc.localDescription) {
                  await sendSignal({
                    senderId: peerId,
                    type: "answer",
                    sdp: pc.localDescription.toJSON(),
                  });
                }
              }
            } catch (err) {
              isSettingRemoteAnswerPending = false;
              console.error("Error handling SDP signal:", err);
            }
          } else if (payload.type === "ice-candidate") {
            try {
              if (!pc.remoteDescription) {
                iceCandidateQueueRef.current.push(payload.candidate);
              } else {
                await pc.addIceCandidate(payload.candidate);
              }
            } catch (err) {
              if (!ignoreOffer) {
                console.error("Error adding ICE candidate:", err);
              }
            }
          }
        }
      )
      .subscribe((subStatus) => {
        if (cancelled || isRoomFull) return;
        if (subStatus === "SUBSCRIBED") {
          const state = channel.presenceState<PresenceEntry>();
          const otherKeys = Object.keys(state).filter((key) => key !== peerId);
          if (otherKeys.length >= 2) {
            rejectAsRoomFull();
            return;
          }
          if (!hasTracked) {
            hasTracked = true;
            void channel.track({ peerId, joinedAt });
          }
        }
      });

    window.addEventListener("beforeunload", cleanupResources);
    window.addEventListener("pagehide", cleanupResources);

    return () => {
      window.removeEventListener("beforeunload", cleanupResources);
      window.removeEventListener("pagehide", cleanupResources);
      cleanupResources();
    };
  }, [roomCode, reconnectAttempt, updateTransfer]);

  const sendText = useCallback((content: string) => {
    const trimmed = content.trim();
    const dc = dcRef.current;
    if (!trimmed || !dc || dc.readyState !== "open") return;

    const wireMessage: WireTextMessage = {
      type: "text",
      id: crypto.randomUUID(),
      content: trimmed,
      timestamp: Date.now(),
    };

    dc.send(JSON.stringify(wireMessage));
    setMessages((prev) => [...prev, { ...wireMessage, sender: "self" }]);
  }, []);

  const sendFile = useCallback(
    (file: File): Promise<void> => {
      const dc = dcRef.current;
      if (!dc || dc.readyState !== "open") {
        return Promise.reject(new Error("DataChannel is not open"));
      }

      const id = crypto.randomUUID();
      setTransfers((prev) => [
        ...prev,
        {
          id,
          name: file.name,
          size: file.size,
          direction: "send",
          progress: 0,
          speedMBps: 0,
          status: "hashing",
          verified: false,
          blobUrl: null,
        },
      ]);

      const runSend = async () => {
        const activeDc = dcRef.current;
        if (!activeDc || activeDc.readyState !== "open") {
          updateTransfer(id, { status: "failed" });
          return;
        }

        try {
          const fileBuffer = await file.arrayBuffer();
          const sha256 = await computeFileSHA256(fileBuffer);

          const metaMessage: WireFileMetaMessage = {
            type: "file-meta",
            id,
            name: file.name,
            size: file.size,
            mimeType: file.type || "application/octet-stream",
            sha256,
          };

          activeDc.send(JSON.stringify(metaMessage));
          activeDc.bufferedAmountLowThreshold = BUFFER_LOW_WATERMARK;
          updateTransfer(id, { status: "transferring" });

          const startedAt = performance.now();
          let lastUiUpdateAt = 0;
          let offset = 0;

          while (offset < fileBuffer.byteLength) {
            if (activeDc.bufferedAmount > BUFFER_HIGH_WATERMARK) {
              await waitForBufferedAmountLow(activeDc);
            }

            const end = Math.min(offset + CHUNK_SIZE, fileBuffer.byteLength);
            const chunk = fileBuffer.slice(offset, end);
            activeDc.send(chunk);
            offset = end;

            const now = performance.now();
            if (
              now - lastUiUpdateAt >= UI_UPDATE_INTERVAL_MS ||
              offset >= fileBuffer.byteLength
            ) {
              lastUiUpdateAt = now;
              const elapsedSeconds = (now - startedAt) / 1000;
              const progress =
                file.size > 0
                  ? Math.min(100, Math.round((offset / file.size) * 100))
                  : 100;
              const speedMBps =
                elapsedSeconds > 0
                  ? Number(
                      (offset / (1024 * 1024) / elapsedSeconds).toFixed(2)
                    )
                  : 0;

              updateTransfer(id, { progress, speedMBps });
            }
          }

          const completeMessage: WireFileCompleteMessage = {
            type: "file-complete",
            id,
          };
          activeDc.send(JSON.stringify(completeMessage));

          updateTransfer(id, {
            progress: 100,
            status: "completed",
            verified: true,
          });
        } catch (err) {
          console.error("Failed to send file:", err);
          updateTransfer(id, { status: "failed" });
        }
      };

      const next = sendChainRef.current.then(runSend, runSend);
      sendChainRef.current = next;
      return next;
    },
    [updateTransfer]
  );

  return {
    status,
    safetyEmojis,
    messages,
    transfers,
    sendText,
    sendFile,
    retryConnection,
  };
}
