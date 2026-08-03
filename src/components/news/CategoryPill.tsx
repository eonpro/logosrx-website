interface CategoryPillProps {
  label: string;
  className?: string;
}

export default function CategoryPill({ label, className = "" }: CategoryPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-medium tracking-wide text-navy/70 ${className}`}
    >
      {label}
    </span>
  );
}
