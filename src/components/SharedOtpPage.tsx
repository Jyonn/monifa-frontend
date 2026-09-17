import { Check, Copy, Link2Off } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../lib/api";
import type { SharedOtp } from "../types";
import { Brand } from "./Brand";

export function SharedOtpPage({ token }: { token: string }) {
  const [otp, setOtp] = useState<SharedOtp | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const result = await api.getSharedOtp(token);
      setOtp(result);
      setLoadedAt(Date.now());
      setNow(Date.now());
      setMissing(false);
    } catch {
      setMissing(true);
    } finally {
      loadingRef.current = false;
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = loadedAt ? Math.floor((now - loadedAt) / 1000) : 0;
  const remaining = otp ? Math.max(0, otp.remaining - elapsed) : 0;
  useEffect(() => {
    if (otp && remaining === 0) load();
  }, [load, otp, remaining]);

  async function copy() {
    if (!otp) return;
    await navigator.clipboard.writeText(otp.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  if (missing) return <main className="shared-page"><Brand /><section className="shared-missing"><Link2Off size={34} /><h1>分享已失效</h1><p>链接可能已过期、被撤销或不存在。</p></section></main>;
  if (!otp) return <main className="shared-page"><Brand /><p className="shared-loading">正在获取验证码</p></main>;

  return <main className="shared-page">
    <Brand />
    <section className="shared-otp">
      <span className="eyebrow">SHARED OTP</span>
      <h1>{otp.issuer}</h1>
      <p>{otp.accountName}</p>
      <button className="shared-code" onClick={copy} aria-label="复制验证码">
        <span>{otp.code.slice(0, Math.ceil(otp.code.length / 2))} {otp.code.slice(Math.ceil(otp.code.length / 2))}</span>
        {copied ? <Check size={22} /> : <Copy size={22} />}
      </button>
      <div className="shared-progress"><span style={{ width: `${(remaining / otp.period) * 100}%` }} /></div>
      <small>{remaining} 秒后更新</small>
      {otp.expiresAt && <small>链接有效至 {new Date(otp.expiresAt).toLocaleString()}</small>}
    </section>
    <p className="shared-security">此页面不会显示或传输 OTP 密钥。</p>
  </main>;
}
