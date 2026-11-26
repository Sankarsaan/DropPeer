const ROOM_CODE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ROOM_CODE_LENGTH = 12;

// 64 visually distinct emojis for DTLS fingerprint verification (256 % 64 === 0, no modulo bias)
const EMOJI_LIST: readonly string[] = [
  "🐶", "🐱", "🦊", "🐻", "🐼", "🐨", "🦁", "🐯",
  "🐸", "🐙", "🦋", "🐝", "🐢", "🐬", "🐳", "🦉",
  "🍎", "🍋", "🍉", "🍇", "🍓", "🍒", "🥑", "🌽",
  "🍕", "🍩", "🍪", "🧁", "☕", "🍵", "🧊", "🍿",
  "🚀", "🛸", "⛵", "🚲", "🚂", "✈️", "⚓", "🧭",
  "🌞", "🌙", "⭐", "🌈", "⚡", "🔥", "❄️", "🌊",
  "💎", "🔑", "🔒", "🔔", "🎈", "🎁", "🎨", "🎸",
  "⚽", "🏀", "🎯", "🎲", "🧩", "🪄", "🛡️", "👑",
] as const;

/**
 * Generates a 12-character URL-safe alphanumeric room code using CSPRNG.
 */
export function generateRoomCode(): string {
  const alphabetLength = ROOM_CODE_ALPHABET.length;
  const maxValidByte = 256 - (256 % alphabetLength);
  const result: string[] = [];
  const buffer = new Uint8Array(ROOM_CODE_LENGTH * 2);

  while (result.length < ROOM_CODE_LENGTH) {
    crypto.getRandomValues(buffer);
    for (let i = 0; i < buffer.length && result.length < ROOM_CODE_LENGTH; i++) {
      const byte = buffer[i];
      if (byte < maxValidByte) {
        result.push(ROOM_CODE_ALPHABET[byte % alphabetLength]);
      }
    }
  }

  return result.join("");
}

/**
 * Computes the lowercase hex-encoded SHA-256 digest of an ArrayBuffer.
 */
export async function computeFileSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashBytes = new Uint8Array(hashBuffer);
  return Array.from(hashBytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function extractSha256Fingerprint(sdp: string, label: string): string {
  const match = sdp.match(/^a=fingerprint:sha-256\s+[0-9A-Fa-f:]+/im);
  if (!match) {
    throw new Error(
      `Missing a=fingerprint:sha-256 line in ${label} SDP`
    );
  }
  return match[0].trim().toLowerCase();
}

/**
 * Derives 4 deterministic verification emojis from the local and remote DTLS
 * SHA-256 fingerprints to help peers detect signaling MITM attacks.
 */
export async function computeSafetyEmojis(
  localSdp: string,
  remoteSdp: string
): Promise<string[]> {
  const localFingerprint = extractSha256Fingerprint(localSdp, "local");
  const remoteFingerprint = extractSha256Fingerprint(remoteSdp, "remote");

  const sorted = [localFingerprint, remoteFingerprint].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  const payload = new TextEncoder().encode(`${sorted[0]}|${sorted[1]}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  const bytes = new Uint8Array(digest);

  return [
    EMOJI_LIST[bytes[0] % EMOJI_LIST.length],
    EMOJI_LIST[bytes[1] % EMOJI_LIST.length],
    EMOJI_LIST[bytes[2] % EMOJI_LIST.length],
    EMOJI_LIST[bytes[3] % EMOJI_LIST.length],
  ];
}
