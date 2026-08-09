import { CloudOff, Github, KeyRound, LogOut, Plus, Settings, ShieldCheck, Unlink, Wifi } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AddEntry } from "./components/AddEntry";
import { Brand } from "./components/Brand";
import { TokenRow } from "./components/TokenRow";
import * as api from "./lib/api";
import type { EntryDraft } from "./lib/parse";
import { cacheEntries, clearCache, loadCachedEntries, loadOfflineUser } from "./lib/storage";
import type { MfaEntry, User } from "./types";

type View = "tokens" | "add" | "settings";

function currentView(): View {
  const value = window.location.hash.split("?")[0].replace("#/", "");
  return value === "add" || value === "settings" ? value : "tokens";
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<MfaEntry[]>([]);
  const [view, setView] = useState<View>(currentView());
  const [online, setOnline] = useState(navigator.onLine);
  const [clockOffset, setClockOffset] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [booting, setBooting] = useState(true);
  const [toast, setToast] = useState("");

  const navigate = useCallback((next: View) => {
    window.location.hash = `#/${next}`;
    setView(next);
  }, []);

  const sync = useCallback(async (activeUser: User) => {
    const before = Date.now();
    const result = await api.listEntries();
    const midpoint = (before + Date.now()) / 2;
    setClockOffset(result.serverTime * 1000 - midpoint);
    setEntries(result.entries);
    setLastSync(new Date());
    await cacheEntries(activeUser.id, result.entries);
  }, []);

  useEffect(() => {
    const onHash = () => setView(currentView());
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    async function boot() {
      if (import.meta.env.DEV && window.location.hash.startsWith("#/preview")) {
        setUser({ id: "preview", displayName: "Jyonn Preview", avatarUrl: "", identities: [{ provider: "github", username: "jyonn", email: "" }] });
        setEntries([
          { id: 1, issuer: "GitHub", accountName: "jyonn@example.com", secret: "JBSWY3DPEHPK3PXP", algorithm: "SHA1", digits: 6, period: 30, createdAt: "" },
          { id: 2, issuer: "齐天簿", accountName: "jyonn", secret: "GEZDGNBVGY3TQOJQ", algorithm: "SHA1", digits: 6, period: 30, createdAt: "" }
        ]);
        setBooting(false);
        return;
      }
      const params = new URLSearchParams(window.location.hash.split("?")[1]);
      const ticket = params.get("ticket");
      if (ticket) {
        try {
          const nextUser = await api.exchangeTicket(ticket);
          setUser(nextUser);
          window.location.hash = "#/tokens";
          await sync(nextUser);
        } catch { setToast("登录凭证已失效，请重新登录"); }
      } else {
        try {
          const nextUser = await api.refreshSession();
          setUser(nextUser);
          await sync(nextUser);
        } catch {
          const offlineUser = await loadOfflineUser();
          if (offlineUser && !navigator.onLine) {
            setUser({ id: offlineUser, displayName: "离线账户", avatarUrl: "", identities: [] });
            setEntries(await loadCachedEntries(offlineUser));
          }
        }
      }
      setBooting(false);
    }
    boot();
  }, [sync]);

  useEffect(() => {
    if (!user || !online) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") sync(user).catch(() => setOnline(false));
    }, 30_000);
    const visible = () => document.visibilityState === "visible" && sync(user).catch(() => setOnline(false));
    document.addEventListener("visibilitychange", visible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [online, sync, user]);

  async function add(draft: EntryDraft) {
    const created = await api.createEntry(draft);
    const next = [...entries, created].sort((a, b) => `${a.issuer}${a.accountName}`.localeCompare(`${b.issuer}${b.accountName}`));
    setEntries(next);
    if (user) await cacheEntries(user.id, next);
    navigate("tokens");
    setToast("验证码已保存");
  }

  async function remove(entry: MfaEntry) {
    if (!window.confirm(`永久删除 ${entry.issuer} · ${entry.accountName}？`)) return;
    await api.deleteEntry(entry.id);
    const next = entries.filter((item) => item.id !== entry.id);
    setEntries(next);
    if (user) await cacheEntries(user.id, next);
  }

  async function signOut() {
    await api.logout();
    if (user) await clearCache(user.id);
    setUser(null);
    setEntries([]);
  }

  async function removeAccount() {
    if (window.prompt("此操作会永久删除全部验证码。请输入 DELETE 确认：") !== "DELETE") return;
    await api.deleteAccount();
    api.clearSession();
    if (user) await clearCache(user.id);
    setUser(null);
    setEntries([]);
  }

  if (booting) return <main className="splash"><Brand /><span>正在校准时间</span></main>;

  if (!user) return <main className="login-page">
    <section className="login-copy"><Brand /><h1>你的验证码，<br />在每一秒准时抵达。</h1><p>使用已有身份登录 Monifa，在浏览器中生成标准 TOTP 验证码。</p></section>
    <section className="login-actions" aria-label="登录方式">
      <span className="eyebrow">CHOOSE AN IDENTITY</span>
      <button onClick={() => { window.location.href = api.authStartUrl("qitian"); }}><span className="qitian-symbol">齐</span><span>使用齐天簿登录</span></button>
      <button onClick={() => { window.location.href = api.authStartUrl("github"); }}><Github size={22} /><span>使用 GitHub 登录</span></button>
      <p><ShieldCheck size={16} />Monifa 不会保存第三方登录 Token</p>
    </section>
  </main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <Brand compact />
      <nav>
        <button className={view === "tokens" ? "active" : ""} onClick={() => navigate("tokens")} title="验证码"><KeyRound /><span>验证码</span></button>
        <button className={view === "add" ? "active" : ""} onClick={() => navigate("add")} title="新增"><Plus /><span>新增</span></button>
        <button className={view === "settings" ? "active" : ""} onClick={() => navigate("settings")} title="设置"><Settings /><span>设置</span></button>
      </nav>
      <div className="sidebar-foot">{online ? <Wifi size={18} /> : <CloudOff size={18} />}</div>
    </aside>
    <main className="workspace">
      {view === "tokens" && <>
        <header className="workspace-header"><div><span className="eyebrow">AUTHENTICATOR</span><h1>验证码</h1></div><div className={`sync-state ${online ? "" : "offline"}`}>{online ? <Wifi size={16} /> : <CloudOff size={16} />}<span>{online ? lastSync ? `更新于 ${lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "在线" : "离线数据"}</span></div></header>
        {entries.length ? <section className="token-list">{entries.map((entry) => <TokenRow key={entry.id} entry={entry} clockOffset={clockOffset} onDelete={() => remove(entry)} />)}</section> : <section className="empty-state"><div className="empty-dial"><KeyRound /></div><h2>还没有验证码</h2><button className="primary-button" onClick={() => navigate("add")}><Plus size={19} />新增第一个</button></section>}
        <button className="floating-add" onClick={() => navigate("add")} aria-label="新增验证码" title="新增验证码"><Plus /></button>
      </>}
      {view === "add" && <AddEntry onSave={add} onClose={() => navigate("tokens")} />}
      {view === "settings" && <section className="settings-page">
        <header className="workspace-header"><div><span className="eyebrow">ACCOUNT</span><h1>身份与设备</h1></div></header>
        <div className="settings-section"><h2>已绑定身份</h2>{user.identities.map((identity) => <div className="identity-row" key={identity.provider}><span className={`identity-icon ${identity.provider}`}>{identity.provider === "github" ? <Github size={20} /> : "齐"}</span><div><strong>{identity.provider === "github" ? "GitHub" : "齐天簿"}</strong><span>{identity.username || identity.email}</span></div><button className="icon-button" disabled={user.identities.length === 1} onClick={() => api.unlinkIdentity(identity.provider).then(() => setUser({ ...user, identities: user.identities.filter((item) => item.provider !== identity.provider) }))} title="解绑"><Unlink size={18} /></button></div>)}</div>
        <div className="settings-section"><h2>绑定另一身份</h2><div className="binding-actions">{!user.identities.some((item) => item.provider === "qitian") && <button onClick={() => api.startIdentityLink("qitian")}><span className="qitian-symbol small">齐</span>绑定齐天簿</button>}{!user.identities.some((item) => item.provider === "github") && <button onClick={() => api.startIdentityLink("github")}><Github size={18} />绑定 GitHub</button>}</div></div>
        <button className="logout-button" onClick={signOut}><LogOut size={18} />退出并清除离线数据</button>
        <button className="delete-account-button" onClick={removeAccount}>永久注销账户</button>
      </section>}
    </main>
    {toast && <button className="toast" onClick={() => setToast("")}>{toast}</button>}
  </div>;
}
