import { Camera, ChevronDown, FileImage, KeyRound, Link2, X } from "lucide-react";
import QrScanner from "qr-scanner";
import { useEffect, useRef, useState } from "react";
import { normalizeManualDraft, parseOtpUri, type EntryDraft } from "../lib/parse";

const empty: EntryDraft = { issuer: "", accountName: "", secret: "", algorithm: "SHA1", digits: 6, period: 30 };

export function AddEntry({ onSave, onClose }: { onSave: (draft: EntryDraft) => Promise<void>; onClose: () => void }) {
  const [mode, setMode] = useState<"uri" | "key" | "camera">("uri");
  const [uri, setUri] = useState("");
  const [draft, setDraft] = useState<EntryDraft>(empty);
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (mode !== "camera" || !videoRef.current) return;
    const scanner = new QrScanner(videoRef.current, (result) => consumeUri(result.data), { highlightScanRegion: true });
    scanner.start().catch(() => setError("无法访问摄像头，请检查浏览器权限"));
    return () => scanner.destroy();
  }, [mode]);

  function consumeUri(value: string) {
    try {
      const parsed = parseOtpUri(value);
      setDraft(parsed);
      setUri(value);
      setMode("key");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法识别二维码");
    }
  }

  async function upload(file?: File) {
    if (!file) return;
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      consumeUri(result.data);
    } catch {
      setError("图片中没有可识别的 TOTP 二维码");
    }
  }

  async function submit() {
    try {
      setSaving(true);
      const value = mode === "uri" ? parseOtpUri(uri) : normalizeManualDraft(draft);
      await onSave(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="add-panel" aria-labelledby="add-title">
      <header className="panel-header">
        <div><span className="eyebrow">NEW FACTOR</span><h2 id="add-title">新增验证码</h2></div>
        <button className="icon-button" onClick={onClose} aria-label="关闭" title="关闭"><X size={20} /></button>
      </header>
      <div className="segmented" role="tablist">
        <button className={mode === "uri" ? "active" : ""} onClick={() => setMode("uri")}><Link2 size={17} />URI</button>
        <button className={mode === "key" ? "active" : ""} onClick={() => setMode("key")}><KeyRound size={17} />Key</button>
        <button className={mode === "camera" ? "active" : ""} onClick={() => setMode("camera")}><Camera size={17} />扫码</button>
      </div>
      {mode === "camera" ? <video ref={videoRef} className="scanner" muted playsInline /> : mode === "uri" ? (
        <label className="field"><span>otpauth URI</span><textarea value={uri} onChange={(event) => setUri(event.target.value)} placeholder="otpauth://totp/..." rows={4} /></label>
      ) : (
        <div className="form-grid">
          <label className="field"><span>服务商</span><input value={draft.issuer} onChange={(event) => setDraft({ ...draft, issuer: event.target.value })} placeholder="GitHub" /></label>
          <label className="field"><span>账户名</span><input value={draft.accountName} onChange={(event) => setDraft({ ...draft, accountName: event.target.value })} placeholder="name@example.com" /></label>
          <label className="field full"><span>Key</span><input className="mono" value={draft.secret} onChange={(event) => setDraft({ ...draft, secret: event.target.value })} placeholder="JBSW Y3DP EHPK 3PXP" /></label>
          <button className="advanced-toggle full" onClick={() => setAdvanced(!advanced)}>高级设置 <ChevronDown size={17} className={advanced ? "rotated" : ""} /></button>
          {advanced && <div className="advanced-grid full">
            <label className="field"><span>算法</span><select value={draft.algorithm} onChange={(e) => setDraft({ ...draft, algorithm: e.target.value as EntryDraft["algorithm"] })}><option>SHA1</option><option>SHA256</option><option>SHA512</option></select></label>
            <label className="field"><span>位数</span><select value={draft.digits} onChange={(e) => setDraft({ ...draft, digits: Number(e.target.value) as 6 | 8 })}><option value="6">6</option><option value="8">8</option></select></label>
            <label className="field"><span>周期（秒）</span><input type="number" min="5" max="300" value={draft.period} onChange={(e) => setDraft({ ...draft, period: Number(e.target.value) })} /></label>
          </div>}
        </div>
      )}
      <label className="upload-button"><FileImage size={18} />从图片读取<input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" onClick={submit} disabled={saving || mode === "camera"}>{saving ? "正在保存" : "保存验证码"}</button>
    </section>
  );
}

