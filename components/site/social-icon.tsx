import type { ReactNode } from "react";
import type { PlatformKey } from "@/lib/platforms";

/**
 * Ikon media sosial untuk footer. Digambar bergaris dengan ketebalan yang sama (bukan logo resmi berwarna),
 * supaya senada dengan situs yang hitam putih; X dan Threads memakai logo aslinya. Platform yang tidak dikenal memakai ikon tautan.
 */
const PATHS: Record<PlatformKey, ReactNode> = {
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" />
    </>
  ),
  tiktok: (
    <>
      <path d="M13.5 3.5v11.25a3.75 3.75 0 1 1-3.75-3.75" />
      <path d="M13.5 3.5c.35 2.6 2.1 4.4 5 4.75" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.25 9.25v5.5l4.75-2.75z" fill="currentColor" />
    </>
  ),
  // logo X yang asli (dari Simple Icons, CC0), diperkecil supaya setara ikon lain
  x: (
    <path
      transform="translate(3.6 3.6) scale(0.7)"
      fill="currentColor"
      stroke="none"
      d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"
    />
  ),
  // logo Threads yang asli (dari Simple Icons, CC0): bentuknya terisi, jadi diperkecil sedikit supaya bobotnya setara ikon bergaris
  threads: (
    <path
      transform="translate(2.4 2.4) scale(0.8)"
      fill="currentColor"
      stroke="none"
      d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"
    />
  ),
  facebook: <path d="M14.5 21v-7.5h2.6l.5-3.25h-3.1V8.4c0-.9.45-1.65 1.75-1.65h1.5V3.9A15 15 0 0 0 15.4 3.75c-2.6 0-4.3 1.6-4.3 4.35v2.15H8.25v3.25h2.85V21" />,
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <path d="M8 10.75v5.5M11.5 16.25v-5.5M11.5 13.4a2.4 2.4 0 0 1 4.8 0v2.85" />
      <circle cx="8" cy="7.9" r="0.7" fill="currentColor" />
    </>
  ),
  spotify: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M7.75 9.6c3-.9 6.4-.6 8.9.85M8.3 12.5c2.4-.65 5-.4 7.1.75M8.9 15.25c1.8-.4 3.6-.25 5.2.6" />
    </>
  ),
  lainnya: (
    <>
      <path d="M10.25 13.75a4 4 0 0 0 5.65 0l3-3a4 4 0 0 0-5.65-5.65l-1 1" />
      <path d="M13.75 10.25a4 4 0 0 0-5.65 0l-3 3a4 4 0 0 0 5.65 5.65l1-1" />
    </>
  ),
};

export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {PATHS[platform as PlatformKey] ?? PATHS.lainnya}
    </svg>
  );
}
