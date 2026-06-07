import { useState } from "react";
import { useAuth } from "../AuthContext";
import { fmtErr } from "../api";
import RetroWindow from "./RetroWindow";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name);
    } catch (ex) { setErr(fmtErr(ex)); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen scrapbook-bg grain flex items-center justify-center p-6 relative" style={{ backgroundImage: "url(/assets/background.png)" }}>
      <img src="/assets/star.png" alt="" className="absolute top-10 left-16 w-16 rotate-12" />
      <img src="/assets/bubble.png" alt="" className="absolute top-24 right-20 w-28 opacity-90" />
      <img src="/assets/cherry.png" alt="" className="absolute bottom-20 left-10 w-20 -rotate-6" />
      <img src="/assets/smiley.png" alt="" className="absolute bottom-16 right-16 w-20 rotate-12" />
      <img src="/assets/digicam.png" alt="" className="absolute top-1/2 left-6 w-32 -rotate-6 hidden lg:block" />

      <div className="relative z-10 w-full max-w-md">
        <img src="/assets/logo.png" alt="afterglow" className="w-72 mx-auto mb-4 drop-shadow-xl" data-testid="logo" />
        <RetroWindow title={mode === "login" ? "SIGN IN.EXE" : "NEW USER.EXE"}>
          <form onSubmit={submit} className="space-y-3 text-sm">
            {mode === "register" && (
              <div>
                <label className="font-bold uppercase text-xs">Display Name</label>
                <input className="retro-input mt-1" value={name} onChange={(e) => setName(e.target.value)} data-testid="auth-name" />
              </div>
            )}
            <div>
              <label className="font-bold uppercase text-xs">Email</label>
              <input type="email" required className="retro-input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="auth-email" />
            </div>
            <div>
              <label className="font-bold uppercase text-xs">Password</label>
              <input type="password" required minLength={4} className="retro-input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="auth-password" />
            </div>
            {err && <div className="text-red-700 text-xs font-bold" data-testid="auth-error">⚠ {err}</div>}
            <button type="submit" disabled={busy} className="retro-btn w-full font-vt text-lg" data-testid="auth-submit">
              {busy ? "loading..." : mode === "login" ? ">> SIGN IN <<" : ">> CREATE ACCOUNT <<"}
            </button>
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }} className="w-full text-xs underline text-blue-800" data-testid="auth-toggle">
              {mode === "login" ? "need an account? register →" : "have an account? sign in →"}
            </button>
          </form>
        </RetroWindow>
        <p className="text-center text-xs mt-3 font-caveat text-pink-700 text-lg">a digital scrapbook for your favorite memories ♡</p>
      </div>
    </div>
  );
}
