import { Check, Copy, Link2, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import * as api from "../lib/api";
import type { MfaEntry } from "../types";

const durations = [
  { label: "1 小时", value: "3600" },
  { label: "24 小时", value: "86400" },
  { label: "7 天", value: "604800" },
  { label: "永久有效", value: "never" }
];

export function ShareDialog({ entry, onClose, onChange }: { entry: MfaEntry; onClose: () => void; onChange: (active: boolean) => void }) {
  const [duration, setDuration] = useState("86400");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    try {
      setBusy(true);
      setError("");
      const result = await api.createShare(entry.id, duration === "never" ? null : Number(duration));
      const nextUrl = `${window.location.origin}${window.location.pathname}#/share/${result.token}`;
      setUrl(nextUrl);
      onChange(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法创建分享链接");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function revoke() {
    if (!window.confirm("立即撤销此验证码的分享链接？已发送的链接将失效。")) return;
    try {
      setBusy(true);
      await api.revokeShare(entry.id);
      onChange(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法撤销分享链接");
      setBusy(false);
    }
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <header className="panel-header">
        <div><span className="eyebrow">BEARER LINK</span><h2 id="share-title">分享验证码</h2></div>
        <button className="icon-button" onClick={onClose} aria-label="关闭" title="关闭"><X size={20} /></button>
      </header>
      <div className="share-target"><strong>{entry.issuer}</strong><span>{entry.accountName}</span></div>
      <p className="share-warning"><ShieldAlert size={18} />任何获得链接的人都能查看实时验证码。链接不包含密钥，但应像密码一样保管。</p>
      {!url ? <>
        <label className="field"><span>有效期</span><select value={duration} onChange={(event) => setDuration(event.target.value)}>{durations.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        <button className="primary-button" onClick={create} disabled={busy}><Link2 size={18} />{busy ? "正在生成" : entry.shareActive ? "生成新链接" : "生成分享链接"}</button>
      </> : <>
        <label className="field"><span>分享 URL</span><div className="share-url"><input value={url} readOnly /><button className="icon-button" onClick={copy} title="复制链接" aria-label="复制链接">{copied ? <Check size={18} /> : <Copy size={18} />}</button></div></label>
        <p className="share-note">新链接已经生效，之前为该验证码生成的链接已失效。</p>
      </>}
      {entry.shareActive && <button className="revoke-button" onClick={revoke} disabled={busy}>撤销现有分享</button>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  </div>;
}
