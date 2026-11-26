# Project: DropPeer (Instant P2P File & Text Drop)

## Core Goal
A zero-storage, end-to-end encrypted, browser-to-browser file and clipboard text transfer web app using native WebRTC DataChannels and Supabase Realtime Broadcast for signaling.

## Tech Stack
- Next.js (App Router), TypeScript, Tailwind CSS
- Native WebRTC API (`RTCPeerConnection`, `RTCDataChannel`)
- `@supabase/supabase-js` (Realtime Broadcast + Presence only — no DB, no Auth)
- `qrcode.react` for room URL QR codes
- `lucide-react` for icons

## Security & Verification
1. **High-Entropy Room Codes:** Generate 12-character URL-safe alphanumeric codes using `crypto.getRandomValues` (e.g., `k9X4m2P7vQ1z`) instead of short guessable codes.
2. **Strict 2-Peer Lock:** Use Supabase Realtime Presence on the room channel to track connected clients. If 2 peers are already present, reject any 3rd client immediately with a "Room Full" state.
3. **4-Emoji DTLS Verification (MITM Protection):**
   - Once `RTCPeerConnection` reaches `connected`, extract the `a=fingerprint:sha-256 ...` line from both `pc.localDescription.sdp` and `pc.remoteDescription.sdp`.
   - Sort the two fingerprint strings lexicographically, concatenate them with `|`, and hash them with `crypto.subtle.digest("SHA-256", ...)`.
   - Map the first 4 bytes of the resulting digest (`byte % EMOJI_LIST.length`) to a fixed list of 64 visually distinct emojis.
   - Display these 4 emojis prominently in the room header so both users can visually confirm no signaling MITM spoof occurred.

## User Flow
1. Landing page `/` has two actions:
   - "Create Room" (generates 12-char high-entropy code, redirects to `/room/[code]`).
   - "Join Room" (input 12-char code).
2. `/room/[code]` displays:
   - Connection status badge: `Waiting for peer` -> `Connecting (ICE)` -> `Connected (P2P)` -> `Disconnected` / `Room Full`.
   - Security badge: The 4-emoji DTLS safety code (visible once connected) with a tooltip explaining MITM verification.
   - Room code + Copy Link button + QR code (collapsible once connected).
   - Shared Clipboard box: type/paste text and hit Send -> appears instantly on the other peer with a 1-click Copy button.
   - File Dropzone: drag-and-drop or select multiple files -> live progress bar (MB/s and %) on both sender and receiver -> SHA-256 verified badge -> auto-download or "Save File" button on completion.

## Wire Protocol (over RTCDataChannel)
- Control messages: JSON strings
  - `{ type: "text", id: string, content: string, timestamp: number }`
  - `{ type: "file-meta", id: string, name: string, size: number, mimeType: string, sha256: string }`
  - `{ type: "file-complete", id: string }`
- File payload: raw `ArrayBuffer` binary chunks of 16 KB (16384 bytes).
- Backpressure: Pause reading/sending when `dataChannel.bufferedAmount > 1024 * 1024` (1 MB); resume on `bufferedamountlow` event (`bufferedAmountLowThreshold = 256 * 1024`).
- Integrity: Compute SHA-256 via `crypto.subtle.digest("SHA-256", buffer)` on sender and verify on receiver before allowing download.

## Strict Non-Goals (Do NOT Build)
- No user accounts, login, or database persistence.
- No multi-peer mesh (strictly 1-to-1 rooms).
- No TURN server setup for v1 (use `stun:stun.l.google.com:19302`; show a friendly fallback message if symmetric NAT blocks connection).