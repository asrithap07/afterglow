import { useState } from "react";
import RetroWindow from "./RetroWindow";
import { api, fmtErr, ASSETS } from "../api";

export default function UploadWindow({ scrapbooks, onClose, onUploaded, defaultTarget = "home" }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [target, setTarget] = useState(defaultTarget); // "home" | scrapbook id
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!file) { setErr("pick a photo first"); return; }
    setBusy(true); setErr(""); setProgress(20);
    try {
      const r = await api.upload(file);
      setProgress(100);
      onUploaded({ url: ASSETS + r.url, caption, target });
      onClose();
    } catch (e) { setErr(fmtErr(e)); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4" onClick={onClose} data-testid="upload-modal">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
        <RetroWindow title="PHOTO UPLOAD ASSISTANT" onClose={onClose}>
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col">
              <label className="bg-[#efefdc] border-2 border-dashed border-[#808080] min-h-[260px] flex flex-col items-center justify-center cursor-pointer relative p-3" data-testid="upload-dropzone">
                <span className="absolute top-2 right-3 text-2xl">♡</span>
                {file ? (
                  <img src={URL.createObjectURL(file)} alt="" className="max-h-[230px] max-w-full object-contain" />
                ) : (
                  <>
                    <p className="font-vt text-xl tracking-wider uppercase">PREVIEW.</p>
                    <p className="text-[11px] text-gray-600 mt-1">Drag or click to select an image...</p>
                    <img src="/assets/digicam.png" alt="" className="w-24 mt-3 opacity-70" />
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} data-testid="upload-file-input" />
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="font-bold uppercase mb-1">[Where Should This Photo Go?]</p>
                <select value={target} onChange={(e) => setTarget(e.target.value)} className="retro-input" data-testid="upload-target">
                  <option value="home">📓 Home Scrapbook (collage)</option>
                  {scrapbooks.map((s) => (
                    <option key={s.id} value={s.id}>{`💿 ${s.title}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="font-bold uppercase mb-1">Handwritten Caption (optional)</p>
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="type your note..." className="retro-input font-caveat text-lg text-blue-700 resize-none h-16" data-testid="upload-caption" />
              </div>
              <div className="bg-[#d4d0c8] border border-t-[#808080] border-l-[#808080] border-b-white border-r-white h-5 flex items-center px-1 gap-1">
                <div className="flex gap-0.5 flex-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-3 h-3" style={{ background: i * 8 < progress ? "#000080" : "transparent" }} />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase">{progress ? `${progress}%` : "WAITING"}</span>
              </div>
              {err && <div className="text-red-700 text-xs" data-testid="upload-error">⚠ {err}</div>}
              <button onClick={handleUpload} disabled={busy} className="retro-btn w-full font-vt text-lg" data-testid="upload-submit">
                {busy ? "uploading..." : ">> START UPLOAD <<"}
              </button>
            </div>
          </div>
        </RetroWindow>
      </div>
    </div>
  );
}
