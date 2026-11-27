"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  FileUp,
  Info,
  Plus,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { DropPeerLogo } from "@/components/DropPeerLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { generateRoomCode } from "@/lib/crypto";
import { useWebRTC, type ConnectionStatus } from "@/hooks/useWebRTC";

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  waiting: "Waiting",
  connecting: "Connecting",
  connected: "Connected (P2P)",
  disconnected: "Disconnected",
  failed: "Connection Failed",
  "room-full": "Room Full",
};

const STATUS_STYLES: Record<ConnectionStatus, string> = {
  waiting:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  connecting:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  connected:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  disconnected:
    "border-zinc-300 bg-zinc-200/80 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300",
  failed:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  "room-full":
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const STATUS_DOT_STYLES: Record<ConnectionStatus, string> = {
  waiting: "bg-amber-500 dark:bg-amber-400 animate-pulse",
  connecting: "bg-sky-500 dark:bg-sky-400 animate-pulse",
  connected: "bg-emerald-500 dark:bg-emerald-400",
  disconnected: "bg-zinc-500",
  failed: "bg-rose-500 dark:bg-rose-400",
  "room-full": "bg-rose-500 dark:bg-rose-400",
};

const STATUS_GLOW_STYLES: Record<ConnectionStatus, string> = {
  waiting: "bg-amber-400/20 dark:bg-amber-500/12",
  connecting: "bg-cyan-400/20 dark:bg-cyan-500/12",
  connected: "bg-emerald-400/20 dark:bg-emerald-500/15",
  disconnected: "bg-zinc-400/15 dark:bg-zinc-600/10",
  failed: "bg-rose-400/15 dark:bg-rose-500/12",
  "room-full": "bg-rose-400/15 dark:bg-rose-500/12",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = typeof params?.code === "string" ? params.code : "";
  const {
    status,
    safetyEmojis,
    messages,
    transfers,
    sendText,
    sendFile,
    retryConnection,
  } = useWebRTC(roomCode);

  const [draft, setDraft] = useState("");
  const [roomUrl, setRoomUrl] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [iceTimedOut, setIceTimedOut] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const prevStatusRef = useRef<ConnectionStatus>(status);

  useEffect(() => {
    setRoomUrl(window.location.href);
  }, [roomCode]);

  // Auto-collapse QR panel once connected, while allowing manual reopen
  useEffect(() => {
    if (prevStatusRef.current !== "connected" && status === "connected") {
      setIsQrOpen(false);
    }
    prevStatusRef.current = status;
  }, [status]);

  // Detect stalled ICE negotiation (> 12 seconds in connecting state)
  useEffect(() => {
    if (status !== "connecting") {
      setIceTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIceTimedOut(true);
    }, 12000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [status]);

  const handleCreateNewRoom = () => {
    const newCode = generateRoomCode();
    router.push(`/room/${newCode}`);
  };

  const handleCopyLink = async () => {
    const urlToCopy = roomUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy room link:", err);
    }
  };

  const handleCopyMessage = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMsgId(id);
      window.setTimeout(() => {
        setCopiedMsgId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const submitMessage = () => {
    if (!draft.trim() || status !== "connected") return;
    sendText(draft);
    setDraft("");
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMessage();
  };

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      submitMessage();
    }
  };

  const enqueueFiles = (fileList: FileList | null) => {
    if (!fileList || status !== "connected") return;
    for (const file of Array.from(fileList)) {
      void sendFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    enqueueFiles(e.target.files);
    e.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (status === "connected" && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    enqueueFiles(e.dataTransfer.files);
  };

  const isConnected = status === "connected";
  const showNatFallback = iceTimedOut || status === "failed";

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      {/* Subtle status-tinted top radial glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={`h-44 w-[min(42rem,95vw)] -translate-y-1/2 rounded-full blur-3xl transition-colors duration-700 ${STATUS_GLOW_STYLES[status]}`}
        />
      </div>

      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/90">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center hover:opacity-90"
          >
            <DropPeerLogo size="sm" />
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span className="max-w-full break-all rounded-lg border border-zinc-200/80 bg-white/80 px-2.5 py-1 font-mono text-xs text-zinc-700 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/75 dark:text-zinc-300">
            {roomCode}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-md ${STATUS_STYLES[status]}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_STYLES[status]}`}
            />
            {STATUS_LABELS[status]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-zinc-700 backdrop-blur-md transition hover:border-zinc-300 hover:bg-white/95 dark:border-zinc-800/80 dark:bg-zinc-900/75 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/85"
          >
            {linkCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">
                  Copied!
                </span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {status !== "room-full" && (
            <button
              type="button"
              onClick={() => setIsQrOpen((prev) => !prev)}
              aria-expanded={isQrOpen}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium backdrop-blur-md transition ${
                isQrOpen
                  ? "border-zinc-300 bg-zinc-100/90 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/85 dark:text-zinc-100"
                  : "border-zinc-200/80 bg-white/80 text-zinc-700 hover:border-zinc-300 hover:bg-white/95 dark:border-zinc-800/80 dark:bg-zinc-900/75 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/85"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>{isQrOpen ? "Hide QR" : "Show QR"}</span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </header>

      {/* Collapsible QR Code Panel (QR container stays solid white in both themes) */}
      {isQrOpen && status !== "room-full" && (
        <section className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/75 dark:shadow-none sm:flex-row">
          <div className="flex min-w-0 flex-col gap-1 text-center sm:text-left">
            <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Scan to join from another device
            </h2>
            <p className="max-w-md text-xs text-zinc-600 dark:text-zinc-400">
              Point your phone camera at this QR code or share the room link.
              This panel collapses automatically once your peer connects.
            </p>
            {roomUrl && (
              <p className="mt-1 break-all font-mono text-[11px] text-zinc-500">
                {roomUrl}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-start gap-2">
            {roomUrl && (
              <div className="rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-transparent">
                <QRCodeSVG value={roomUrl} size={132} marginSize={4} />
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsQrOpen(false)}
              aria-label="Collapse QR code"
              className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* Security Badge (DTLS 4-Emoji Verification) */}
      {isConnected && safetyEmojis && (
        <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 dark:border-emerald-500/25 dark:bg-emerald-500/5">
          <div className="flex min-w-0 items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  DTLS Safety Code
                </span>
                <div className="group relative inline-flex items-center">
                  <button
                    type="button"
                    aria-label="About DTLS safety code"
                    className="-my-2 inline-flex min-h-[44px] min-w-[44px] cursor-help items-center justify-center text-emerald-600/80 hover:text-emerald-700 focus:outline-none dark:text-emerald-400/70 dark:hover:text-emerald-300"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                  <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-[min(16rem,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white p-2.5 text-[11px] leading-relaxed text-zinc-700 shadow-xl group-hover:block group-focus-within:block dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 sm:left-1/2 sm:-translate-x-1/2">
                    Compare these 4 emojis on both devices to verify end-to-end
                    encryption and prevent MITM spoofing.
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Verify these 4 emojis match on your peer&apos;s screen
              </p>
            </div>
          </div>

          <div
            className="rounded-xl border border-emerald-500/25 bg-white px-3.5 py-1.5 text-xl tracking-widest dark:border-emerald-500/20 dark:bg-zinc-950/70 sm:text-2xl"
            aria-label="DTLS safety emojis"
          >
            {safetyEmojis.join(" ")}
          </div>
        </section>
      )}

      {/* ICE Stalled / Failed Symmetric NAT Banner */}
      {showNatFallback && (
        <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 text-xs text-amber-900 dark:text-amber-100">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Direct P2P connection is taking longer than expected
              </p>
              <p className="mt-0.5 text-amber-800/80 dark:text-amber-200/80">
                A strict firewall or Symmetric NAT may be blocking direct P2P
                UDP traffic between these networks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIceTimedOut(false);
              retryConnection();
            }}
            className="inline-flex min-h-[44px] w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/20 px-3.5 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-500/30 dark:border-amber-400/30 dark:text-amber-200 sm:w-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {status === "disconnected" && !showNatFallback && (
        <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
            <span>
              Peer disconnected. You can wait for them to rejoin or retry the
              connection.
            </span>
          </div>
          <button
            type="button"
            onClick={retryConnection}
            className="inline-flex min-h-[44px] w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-800 transition hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 sm:w-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Content */}
      {status === "room-full" ? (
        <div className="mt-8 flex flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/15">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-300" />
            </div>
            <h2 className="font-display text-base font-semibold text-rose-900 dark:text-rose-100">
              Room Already Full
            </h2>
            <p className="mt-2 text-sm text-rose-800/80 dark:text-rose-200/80">
              This room already has 2 peers connected. DropPeer enforces strict
              1-to-1 rooms for end-to-end security.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleCreateNewRoom}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                Create New Room
              </button>
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid flex-1 grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Left Column: Shared Clipboard */}
          <section className="flex min-h-[24rem] min-w-0 flex-col rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/75 dark:shadow-none sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clipboard className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Shared Clipboard
                </h2>
              </div>
              <span className="text-[11px] text-zinc-500">
                {messages.length} {messages.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="flex min-h-52 max-h-[26rem] flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/60">
              {messages.length === 0 ? (
                <p className="m-auto text-center text-xs text-zinc-500">
                  {isConnected
                    ? "Connected! Paste or type text below to send instantly."
                    : "Shared text and links will appear here once connected."}
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`group flex min-w-0 max-w-[90%] flex-col gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm ${
                      msg.sender === "self"
                        ? "self-end border-emerald-500/30 bg-emerald-500/10 text-zinc-900 dark:border-emerald-500/25 dark:text-zinc-100"
                        : "self-start border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                    </p>
                    <div className="flex items-center justify-between gap-3 pt-0.5 text-[11px] text-zinc-500">
                      <span>
                        {msg.sender === "self" ? "You" : "Peer"} ·{" "}
                        {formatTime(msg.timestamp)}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopyMessage(msg.id, msg.content)}
                        className="inline-flex min-h-[44px] cursor-pointer items-center gap-1 rounded px-2 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-700 dark:text-emerald-300">
                              Copied
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="mt-3 flex flex-col gap-2">
              <textarea
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                disabled={!isConnected}
                placeholder={
                  isConnected
                    ? "Type or paste text... (Ctrl+Enter / Cmd+Enter to send)"
                    : "Waiting for P2P connection..."
                }
                className="min-h-[88px] w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-900 placeholder-zinc-400 transition focus:border-zinc-400 focus:bg-white focus:outline-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-600 dark:focus:bg-zinc-950"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-500">
                  Ctrl+Enter / Cmd+Enter to send
                </span>
                <button
                  type="submit"
                  disabled={!isConnected || !draft.trim()}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>
            </form>
          </section>

          {/* Right Column: Drag-and-Drop File Zone */}
          <section className="flex min-h-[24rem] min-w-0 flex-col rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/75 dark:shadow-none sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  File Transfer
                </h2>
              </div>
              <span className="text-[11px] text-zinc-500">
                16 KB chunks · SHA-256 verified
              </span>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (isConnected) fileInputRef.current?.click();
              }}
              role="button"
              tabIndex={isConnected ? 0 : -1}
              onKeyDown={(e) => {
                if (isConnected && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center backdrop-blur-sm transition ${
                !isConnected
                  ? "cursor-not-allowed border-zinc-200/80 bg-zinc-50/70 opacity-60 dark:border-zinc-800 dark:bg-zinc-950/50 dark:opacity-50"
                  : isDragging
                    ? "cursor-pointer border-emerald-500 bg-emerald-500/10 dark:border-emerald-400"
                    : "cursor-pointer border-zinc-300 bg-zinc-50/75 hover:border-zinc-400 hover:bg-zinc-100/80 dark:border-zinc-700 dark:bg-zinc-950/60 dark:hover:border-zinc-500 dark:hover:bg-zinc-950/80"
              }`}
            >
              <UploadCloud
                className={`h-8 w-8 ${
                  isDragging
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400"
                }`}
              />
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {isConnected
                  ? "Drop files here or click to select"
                  : "Connect to a peer to send files"}
              </p>
              <p className="text-xs text-zinc-500">
                Multiple files supported · Direct P2P with zero server storage
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                disabled={!isConnected}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="mt-4 flex max-h-[22rem] flex-1 flex-col gap-2.5 overflow-y-auto">
              {transfers.length === 0 ? (
                <p className="m-auto text-center text-xs text-zinc-500">
                  No file transfers yet.
                </p>
              ) : (
                transfers.map((t) => (
                  <div
                    key={t.id}
                    className="flex min-w-0 flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/70"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                          {t.direction === "send" ? "↑" : "↓"} {t.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          {formatBytes(t.size)} · {t.speedMBps.toFixed(2)} MB/s
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                        {t.progress}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className={`h-full transition-all duration-150 ${
                          t.status === "failed"
                            ? "bg-rose-500"
                            : t.status === "completed"
                              ? "bg-emerald-500"
                              : "bg-sky-500"
                        }`}
                        style={{ width: `${t.progress}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      {t.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          SHA-256 Verified
                        </span>
                      ) : t.status === "failed" ? (
                        <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                          Transfer or SHA-256 check failed
                        </span>
                      ) : (
                        <span className="text-[11px] capitalize text-zinc-500 dark:text-zinc-400">
                          {t.status}...
                        </span>
                      )}

                      {t.direction === "receive" && t.blobUrl && (
                        <a
                          href={t.blobUrl}
                          download={t.name}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Save File
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
