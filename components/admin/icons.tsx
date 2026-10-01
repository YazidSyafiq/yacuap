/** Ikon garis untuk panel admin, digambar sendiri supaya ikut warna tulisan (currentColor). */
type IconProps = { className?: string };

function Base({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const DashboardIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
  </Base>
);

export const PenIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17l-1 3Z" />
    <path d="M14.5 7.5l3 3" />
  </Base>
);

export const TagIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3.5 12.2V5a1.5 1.5 0 0 1 1.5-1.5h7.2a1.5 1.5 0 0 1 1.06.44l7 7a1.5 1.5 0 0 1 0 2.12l-7.2 7.2a1.5 1.5 0 0 1-2.12 0l-7-7a1.5 1.5 0 0 1-.44-1.06Z" />
    <circle cx="8" cy="8" r="1.2" />
  </Base>
);

export const MusicIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M9 18V6l11-2.5v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="15.5" r="2.5" />
  </Base>
);

export const QuoteIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-3.9A8 8 0 1 1 20 12Z" />
  </Base>
);

export const CommentIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 5.5h16v11H9.5L5.5 20v-3.5H4v-11Z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </Base>
);

export const UserIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Base>
);

export const ExternalIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </Base>
);

export const LogoutIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M10 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H10" />
    <path d="M15 8l4 4-4 4M19 12H9.5" />
  </Base>
);

export const PanelIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M9.5 4.5v15" />
  </Base>
);

export const MoreIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 5.5h.01M12 12h.01M12 18.5h.01" strokeWidth="2.6" />
  </Base>
);

export const ArrowIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);

export const EyeIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

export const ShieldIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3.5l7 2.5v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-2.5Z" />
    <path d="M9 12l2.2 2.2L15.2 10" />
  </Base>
);

export const MailIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="M4 7.5l8 5.5 8-5.5" />
  </Base>
);

export const PhoneIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 5 5.5 1.5 1.5 0 0 1 6.5 4Z" />
  </Base>
);

export const PinIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 21s6.5-5.7 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.3 12 21 12 21Z" />
    <circle cx="12" cy="10.5" r="2.3" />
  </Base>
);

export const CapIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5Z" />
    <path d="M6.5 11.5v4c1.5 1.5 3.5 2 5.5 2s4-.5 5.5-2v-4" />
  </Base>
);

export const CalendarIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Base>
);

export const CheckBadgeIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12.2l2.3 2.3 4.7-4.8" />
  </Base>
);

export const TrashIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12h9.4l.8-12M10 11v5M14 11v5" />
  </Base>
);

export const SearchIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </Base>
);

export const NoteIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M5.5 4.5h13v15h-13z" />
    <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
  </Base>
);

export const PublishIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 16V5M7.5 9.5L12 5l4.5 4.5" />
    <path d="M4.5 15v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3" />
  </Base>
);

export const ArchiveIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="4.5" width="17" height="4" rx="1" />
    <path d="M5 8.5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-10M10 12.5h4" />
  </Base>
);

export const PlusIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const ImageIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M20 16l-4.5-4.5L7 19" />
  </Base>
);

export const LinkIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M10 13.5a4 4 0 0 0 5.7.4l2.5-2.5a4 4 0 0 0-5.7-5.7l-1.3 1.3" />
    <path d="M14 10.5a4 4 0 0 0-5.7-.4l-2.5 2.5a4 4 0 0 0 5.7 5.7l1.3-1.3" />
  </Base>
);

export const BackIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Base>
);

export const ShareIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="17.5" cy="5.5" r="2.5" />
    <circle cx="6.5" cy="12" r="2.5" />
    <circle cx="17.5" cy="18.5" r="2.5" />
    <path d="M8.7 10.8l6.6-4M8.7 13.2l6.6 4" />
  </Base>
);

export const DownloadIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" />
    <path d="M4.5 16v2.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V16" />
  </Base>
);
