"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { DropPeerLogo } from "@/components/DropPeerLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { generateRoomCode } from "@/lib/crypto";

const STEPS = [
  {
    number: "01",
    icon: Sparkles,
    title: "Create a Room",
    description:
      'Click "Create Room" on the home page to generate a unique 12-character room code.',
  },
  {
    number: "02",
    icon: QrCode,
    title: "Connect Your Second Device",
    description:
      "Scan the QR code with your phone or open the room link on another computer.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Verify the 4 Safety Emojis",
    description:
      "Once connected, confirm the 4 emojis in the header match on both screens to guarantee an unspoofed, end-to-end encrypted connection.",
  },
  {
    number: "04",
    icon: UploadCloud,
    title: "Drop Files or Text",
    description:
      "Drag and drop files or paste text into the shared clipboard for instant direct transfer.",
  },
] as const;

const CAPABILITIES = [
  "Send multiple files of any type (photos, PDFs, ZIPs, videos) directly between devices with live speed and progress tracking.",
  "Share links and text snippets instantly via the live Shared Clipboard.",
  "Transfer across the same Wi-Fi (fastest, stays on your local router) or across different internet networks.",
  "Rely on automatic end-to-end encryption (DTLS) and SHA-256 file integrity verification.",
] as const;

const LIMITATIONS = [
  {
    label: "No Cloud Storage or History:",
    detail:
      "Nothing is saved on any server. Refreshing or closing the tab permanently clears the session.",
  },
  {
    label: "Strictly 1-to-1 Rooms:",
    detail:
      "Only 2 devices can join a room at a time (a 3rd device is automatically blocked).",
  },
  {
    label: "Both Devices Must Stay Open:",
    detail:
      "Because transfers happen directly peer-to-peer, both browser tabs must remain open until the transfer completes.",
  },
  {
    label: "Strict Firewalls:",
    detail:
      "Some restrictive campus or corporate Wi-Fi networks (Symmetric NAT) may block direct peer-to-peer connections.",
  },
] as const;

export default function HowToUsePage() {
  const router = useRouter();

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    router.push(`/room/${code}`);
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800/90">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center hover:opacity-90"
        >
          <DropPeerLogo size="sm" />
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 py-8 sm:py-10">
        {/* Intro */}
        <section className="text-center sm:text-left">
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            How to Use DropPeer
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            Direct browser-to-browser file and clipboard sharing in seconds — no
            accounts, no cloud uploads, no setup.
          </p>
        </section>

        {/* Section 1: How It Works (4-Step Visual Guide) */}
        <section aria-labelledby="how-it-works-heading">
          <h2
            id="how-it-works-heading"
            className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            How It Works
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/50 dark:shadow-none"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                      STEP {step.number}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2 & 3: Capabilities vs Limitations */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Section 2: What You Can Do */}
          <section
            aria-labelledby="can-do-heading"
            className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/50 dark:shadow-none sm:p-6"
          >
            <h2
              id="can-do-heading"
              className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              What You Can Do
            </h2>
            <ul className="mt-4 flex flex-col gap-3.5">
              {CAPABILITIES.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-sm">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3: What You Can't Do / Limitations */}
          <section
            aria-labelledby="limitations-heading"
            className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/50 dark:shadow-none sm:p-6"
          >
            <h2
              id="limitations-heading"
              className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              What You Can&apos;t Do &amp; Limitations
            </h2>
            <ul className="mt-4 flex flex-col gap-3.5">
              {LIMITATIONS.map((item) => (
                <li key={item.label} className="flex items-start gap-2.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-sm">
                    <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.label}
                    </strong>{" "}
                    {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Bottom CTA */}
        <section className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-6 text-center dark:bg-emerald-500/5 sm:flex-row sm:text-left">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Ready to drop a file?
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Start an encrypted 1-to-1 room and connect your devices in seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateRoom}
            className="inline-flex min-h-[44px] w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 active:scale-[0.99] sm:w-auto"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Create a Room
          </button>
        </section>
      </main>
    </div>
  );
}
