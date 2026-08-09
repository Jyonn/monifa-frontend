export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="Monifa">
      <span className="brand-mark" aria-hidden="true">M</span>
      {!compact && <span className="brand-name">Monifa</span>}
    </div>
  );
}

