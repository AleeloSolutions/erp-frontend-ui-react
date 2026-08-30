export interface AppMarkProps {
  kind: string;
}

/** Decorative module icon shapes (scoped to landing CSS). */
export function AppMark({ kind }: AppMarkProps) {
  return (
    <span aria-hidden="true" className={`app-mark mark-${kind}`}>
      <span className="mark-shape-i" />
      <span className="mark-shape-b" />
    </span>
  );
}
