import { useId } from "react";

interface DropPeerLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}

const SIZE_MAP = {
  sm: { box: "h-7 w-7", text: "text-base" },
  md: { box: "h-8 w-8", text: "text-lg" },
  lg: { box: "h-11 w-11", text: "text-3xl sm:text-4xl" },
} as const;

export function DropPeerLogo({
  size = "md",
  showWordmark = true,
}: DropPeerLogoProps) {
  const gradId = useId();
  const styles = SIZE_MAP[size];

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        fill="none"
        className={`${styles.box} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={gradId}
            x1="8"
            y1="8"
            x2="56"
            y2="56"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="16" fill={`url(#${gradId})`} />
        <path
          d="M23 22h14.5a4.5 4.5 0 0 1 3.18 7.68l-3.68 3.68"
          stroke="#09090b"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M34 17l5 5-5 5"
          stroke="#09090b"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M41 42H26.5a4.5 4.5 0 0 1-3.18-7.68l3.68-3.68"
          stroke="#09090b"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 47l-5-5 5-5"
          stroke="#09090b"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark && (
        <span
          className={`font-display font-bold tracking-tight text-zinc-900 dark:text-zinc-50 ${styles.text}`}
        >
          DropPeer
        </span>
      )}
    </span>
  );
}
