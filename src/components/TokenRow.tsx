import { Check, Copy, Share2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { generateCode, secondsRemaining } from "../lib/totp";
import type { MfaEntry } from "../types";

function initials(issuer: string) {
  return issuer.trim().slice(0, 2).toUpperCase();
}

export function TokenRow({ entry, clockOffset, onDelete, onShare }: { entry: MfaEntry; clockOffset: number; onDelete: () => void; onShare: () => void }) {
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const corrected = now + clockOffset;
  const code = useMemo(() => generateCode(entry, corrected), [entry, corrected]);
  const remaining = secondsRemaining(entry.period, corrected);
  const progress = remaining / entry.period;
  const hue = [...entry.issuer].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article className="token-row">
      <div className="issuer-mark" style={{ "--issuer-hue": hue } as React.CSSProperties}>{initials(entry.issuer)}</div>
      <div className="token-identity">
        <strong>{entry.issuer}</strong>
        <span>{entry.accountName}</span>
      </div>
      <button className="code-button" onClick={copy} aria-label={`复制 ${entry.issuer} 验证码`}>
        <span>{code.slice(0, Math.ceil(code.length / 2))} {code.slice(Math.ceil(code.length / 2))}</span>
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
      <div className="timer" style={{ "--progress": progress } as React.CSSProperties} aria-label={`剩余 ${remaining} 秒`}>
        <span>{remaining}</span>
      </div>
      <button className={`icon-button ${entry.shareActive ? "shared" : ""}`} onClick={onShare} aria-label={`分享 ${entry.issuer}`} title="分享">
        <Share2 size={18} />
      </button>
      <button className="icon-button danger" onClick={onDelete} aria-label={`删除 ${entry.issuer}`} title="删除">
        <Trash2 size={19} />
      </button>
    </article>
  );
}
