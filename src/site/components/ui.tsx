import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12 ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[11px] uppercase tracking-[0.22em] text-accent ${className}`}>
      {children}
    </span>
  );
}

export function SectionHeading({
  children,
  className = "",
  as: As = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <As className={`font-display font-semibold leading-[1.05] tracking-[-0.01em] text-ink ${className}`}>
      {children}
    </As>
  );
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  type?: "button" | "submit";
};

export function Button({ children, href, onClick, variant = "primary", className = "", type = "button" }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium tracking-wide transition-all duration-200 ease-out rounded-[2px]";
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-ink hover:bg-accent-hover hover:-translate-y-0.5"
      : "border border-ink/15 text-ink hover:border-accent hover:text-accent";
  const cls = `${base} ${styles} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function StatusChip({ status, label }: { status: string; label: string }) {
  const tone =
    status === "available"
      ? "text-accent border-accent/30 bg-accent/5"
      : status === "reserved"
      ? "text-sand border-sand/40 bg-sand/5"
      : "text-ink-soft border-line bg-ink/5";
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 border rounded-[2px] ${tone}`}>
      {label}
    </span>
  );
}
