"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CloudOff,
  HelpCircle,
  Plus,
  QrCode,
  Smartphone,
} from "lucide-react";
import { DropPeerLogo } from "@/components/DropPeerLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { generateRoomCode } from "@/lib/crypto";

function extractRoomCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const roomPathMatch = trimmed.match(/\/room\/([A-Za-z0-9_-]+)/);
  if (roomPathMatch?.[1]) {
    return roomPathMatch[1];
  }

  if (/^[A-Za-z0-9_-]{4,64}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

const UTILITY_CARDS = [
  {
    icon: Smartphone,
    title: "Ditch Self-Emailing",
    description:
      "Instantly move photos, PDFs, and links between your laptop and phone.",
  },
  {
    icon: QrCode,
    title: "Scan & Go",
    description:
      "Connect devices in seconds with a QR code. No accounts, no logins, no installs.",
  },
  {
    icon: CloudOff,
    title: "Zero Cloud Clutter",
    description:
      "Files transfer straight between your devices and never sit on a server.",
  },
] as const;

export default function HomePage() {
  const router = useRouter();
  const [joinInput, setJoinInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    router.push(`/room/${code}`);
  };

  const handleJoinRoom = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = extractRoomCode(joinInput);
    if (!code) {
      setError("Enter a valid 12-character room code or full room URL.");
      return;
    }
    setError(null);
    router.push(`/room/${code}`);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      {/* Top-right header */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-end gap-2">
        <Link
          href="/how-to-use"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-zinc-700 backdrop-blur-md transition hover:border-zinc-300 hover:bg-white/95 dark:border-zinc-800/80 dark:bg-zinc-900/75 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/85"
        >
          <HelpCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>How to Use</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center py-6 text-center sm:py-8">
        <h1 className="sr-only font-display">DropPeer</h1>
        <DropPeerLogo size="lg" />

        <p className="mt-4 max-w-md text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
          Zero-storage, end-to-end encrypted P2P file &amp; text drop
        </p>

        {/* Primary & Secondary Actions */}
        <div className="mt-8 w-full max-w-lg rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-xl shadow-zinc-900/5 backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/75 dark:shadow-black/40 sm:p-6">
          <button
            type="button"
            onClick={handleCreateRoom}
            className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Create Room
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              or join existing
            </span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <form
            onSubmit={handleJoinRoom}
            className="flex flex-col gap-2.5 sm:flex-row"
          >
            <input
              type="text"
              value={joinInput}
              onChange={(e) => {
                setJoinInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste 12-char code or room URL..."
              aria-label="Room code or URL"
              className="min-h-[44px] w-full flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-base text-zinc-900 placeholder-zinc-400 transition focus:border-zinc-400 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-600 dark:focus:bg-zinc-950"
            />
            <button
              type="submit"
              className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 sm:w-auto"
            >
              Join Room
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {error && (
            <p className="mt-2.5 text-left text-xs text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
        </div>

        {/* Everyday Utility Cards */}
        <section
          aria-label="Why DropPeer"
          className="mt-8 grid w-full grid-cols-1 gap-3.5 text-left sm:grid-cols-3"
        >
          {UTILITY_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/75 dark:shadow-none"
              >
                <div className="mb-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {card.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {card.description}
                </p>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
