export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="Monifa · 时符">
      <img className="brand-mark" src="/favicon.svg" alt="" aria-hidden="true" />
      {!compact && <span className="brand-name">Monifa · 时符</span>}
    </div>
  );
}
