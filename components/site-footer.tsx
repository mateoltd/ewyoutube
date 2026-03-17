import Link from "next/link";

type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className = "" }: SiteFooterProps) {
  return (
    <footer className={className}>
      <p className="text-[11px] text-text-tertiary/70">
        Use only for content you own or are authorized to download. Read the{" "}
        <Link
          href="/disclaimer"
          className="text-text-secondary transition-colors hover:text-text"
        >
          legal disclaimer
        </Link>
        .
      </p>
    </footer>
  );
}
