export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="Monifa">
      <img className="brand-mark" src="/favicon.svg" alt="" aria-hidden="true" />
      {!compact && <span className="brand-name">Monifa</span>}
    </div>
  );
}
