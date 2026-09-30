/** Ikon pemutar, digambar sendiri supaya tetap monokrom dan ikut warna tulisan (currentColor). */
type IconProps = { className?: string };

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 5.2v13.6a1 1 0 0 0 1.52.85l11-6.8a1 1 0 0 0 0-1.7l-11-6.8A1 1 0 0 0 8 5.2Z" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <rect x="6" y="4.5" width="4.5" height="15" rx="1.2" />
      <rect x="13.5" y="4.5" width="4.5" height="15" rx="1.2" />
    </svg>
  );
}

export function NextIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M5 6.1v11.8a1 1 0 0 0 1.55.83L15 13.1v4.4a1.25 1.25 0 0 0 2.5 0v-11a1.25 1.25 0 0 0-2.5 0v4.4L6.55 5.27A1 1 0 0 0 5 6.1Z" />
    </svg>
  );
}

export function PreviousIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M19 6.1v11.8a1 1 0 0 1-1.55.83L9 13.1v4.4a1.25 1.25 0 0 1-2.5 0v-11a1.25 1.25 0 0 1 2.5 0v4.4l8.45-5.63A1 1 0 0 1 19 6.1Z" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/** Tiga batang naik-turun: penanda lagu yang sedang jalan. Diam kalau `paused`. */
export function Equalizer({ paused = false, className }: IconProps & { paused?: boolean }) {
  return (
    <span aria-hidden="true" data-paused={paused || undefined} className={`equalizer ${className ?? ""}`}>
      <span />
      <span />
      <span />
    </span>
  );
}

/** Lingkaran berputar selama lagu dimuat. */
export function Spinner({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`animate-spin ${className ?? ""}`}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M20.5 12a8.5 8.5 0 0 0-8.5-8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
