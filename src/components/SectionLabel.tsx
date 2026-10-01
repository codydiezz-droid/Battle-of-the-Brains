import { cx } from "../lib/cx";

interface SectionLabelProps {
  index?: string;
  label: string;
  dark?: boolean;
  className?: string;
}

/** The small "01 — Our story" marker that opens each section, like a journal entry. */
export function SectionLabel({ index, label, dark = false, className }: SectionLabelProps) {
  return (
    <p className={cx("eyebrow flex items-center gap-3", dark ? "text-muted-dark" : "text-muted", className)}>
      {index && <span className={cx("tabular-nums", dark ? "text-cream" : "text-ink")}>{index}</span>}
      <span aria-hidden="true" className="h-px w-10 bg-gold" />
      <span>{label}</span>
    </p>
  );
}
