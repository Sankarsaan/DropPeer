# DropPeer

**Zero-storage, end-to-end encrypted, peer-to-peer file and clipboard transfer directly in your browser.**

[**Live Demo → drop-peer.vercel.app**](https://drop-peer.vercel.app/)

DropPeer eliminates the need to email files to yourself or use messaging apps to move photos, PDFs, and links between your laptop and phone. Open a room, scan the QR code, verify the 4-emoji safety code, and transfer files directly between devices with zero server storage.

---

## Key Features

- **Direct P2P File Transfer:** Drag and drop multiple files of any type with real-time progress (%) and transfer speed (MB/s).
- **Live Shared Clipboard:** Instantly push links, code snippets, and text between devices with 1-click copy.
- **QR Code Pairing:** Scan from your phone camera to join a room in seconds—no accounts, logins, or installs.
- **16 KB Chunking & Backpressure Control:** Streams large files smoothly without freezing the browser or spiking memory.
- **4-Emoji MITM Verification:** Cryptographically verifies both peers' DTLS certificate fingerprints to prevent signaling spoofing.
- **SHA-256 Integrity Checks:** Automatically hashes files before sending and verifies the exact digest on the receiver before saving.
- **Responsive & Theme-Ready:** Mobile-first UI with Light/Dark mode support and a built-in `/how-to-use` guide.

---

## Architecture

DropPeer strictly separates the **Control Plane** (signaling) from the **Data Plane** (file and text transfer):

```text
  [ Device A ] <─────── Supabase Realtime (Control Plane) ───────> [ Device B ]
       │                  (SDP Offer/Answer, ICE, 2-Peer Lock)          │
       │                                                                │
       └══════════════ WebRTC RTCDataChannel (Data Plane) ══════════════┘
                    (Direct P2P: SCTP over DTLS over UDP — 0 Server Storage)
```

1. **Control Plane (Supabase Realtime):** Uses ephemeral **Broadcast** channels to exchange WebRTC SDP Offers, Answers, and ICE candidates, and **Presence** to enforce a strict 2-peer room lock. No database tables or storage buckets are used.
2. **NAT Traversal (ICE + STUN):** Automatically picks the fastest route—local LAN (`host` candidates) when on the same Wi-Fi, or direct UDP hole punching (`srflx` via Google STUN) across different networks.
3. **Data Plane (Native WebRTC):** Once `RTCDataChannel` opens, Supabase is completely out of the path. Files are sliced into **16 KB `ArrayBuffer` chunks** and paced using `dataChannel.bufferedAmount` (pausing above 1 MB and resuming on `bufferedamountlow` at 256 KB).
4. **Race Condition Handling:** Implements the Polite/Impolite Peer pattern for SDP glare resolution and queues early ICE candidates until `setRemoteDescription()` completes.

---

## Security Model

- **Mandatory End-to-End Encryption (DTLS):** All `RTCDataChannel` traffic is encrypted in transit by the browser using DTLS.
- **MITM Protection (4-Emoji Safety Code):** Extracts `a=fingerprint:sha-256` from both local and remote SDPs, sorts and hashes them with SHA-256, and maps the digest to 4 distinct emojis. Matching emojis on both screens mathematically proves no signaling Man-in-the-Middle occurred.
- **High-Entropy Room Codes:** Generates 12-character alphanumeric tokens using `crypto.getRandomValues`.
- **Strict 2-Peer Lock:** Any 3rd client attempting to join an active room is immediately rejected with a `Room Full` state.
- **End-to-End Integrity:** Uses the Web Crypto API (`crypto.subtle.digest`) to verify SHA-256 checksums on every transferred file.

---

## Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS, `next-themes`, `lucide-react`
- **Networking:** Native WebRTC API (`RTCPeerConnection`, `RTCDataChannel`)
- **Signaling:** Supabase Realtime (Broadcast & Presence)
- **Utilities:** `qrcode.react`, Web Crypto API
- **Deployment:** Vercel

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/drop-peer.git
cd drop-peer
npm install
```

### 2. Configure environment variables

Create a free project on [Supabase](https://supabase.com/dashboard) (no tables or auth required) and add your credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key-here
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in two browser tabs to test locally.

---

## Current Limitations

- **Ephemeral by Design:** Nothing is stored on a server; refreshing or closing a tab ends the session.
- **Both Tabs Must Stay Open:** Transfers require both peers to remain connected until completion.
- **Symmetric NAT / Strict Firewalls:** v1 uses public STUN servers only. Restrictive corporate or campus firewalls that block direct UDP may require a TURN relay server.
