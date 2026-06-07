import { useState } from "react";
import RetroWindow from "./RetroWindow";
import { api, fmtErr } from "../api";

const COVERS = [
  { id: "polkadot", label: "POLKA", img: "/assets/cd-polkadot.jpeg" },
  { id: "rainbow", label: "RAINBOW", img: "/assets/cd-rainbow.jpeg" },
  { id: "iridescent", label: "IRIDISC", img: "/assets/cd-polkadot.jpeg" },
  { id: "glitter", label: "GLITTER", img: "/assets/cd-rainbow.jpeg" },
];

export default function ScrapbookWindow({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cover, setCover] = useState("polkadot");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) { setErr("scrapbook needs a title"); return; }
    setBusy(true); setErr("");
    try {
      const r = await api.createScrapbook({ title: title.trim(), description: desc, cover_style: cover });
      onCreated(r);
      onClose();
    } catch (e) { setErr(fmtErr(e)); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4" onClick={onClose} data-testid="scrapbook-modal">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
        <RetroWindow title="CREATE NEW SCRAPBOOK" onClose={onClose}>
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col">
              <div className="bg-[#efefdc] border-2 border-dashed border-[#808080] min-h-[260px] flex flex-col items-center justify-center p-3 relative">
                <span className="absolute top-2 right-3 text-2xl">☆</span>
                <span className="absolute bottom-2 left-3 text-lg">★</span>
                <p className="font-vt text-xl tracking-wider uppercase mb-3">COVER PREVIEW.</p>
                <img src={COVERS.find((c) => c.id === cover)?.img} alt="" className="w-40 shadow-paper" data-testid="scrapbook-cover-preview" />
                <p className="mt-2 font-caveat text-2xl text-blue-700">{title || "untitled"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-bold uppercase mb-1">Scrapbook Title:</p>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="retro-input" placeholder="e.g., BEACH WEEKEND" data-testid="scrapbook-title" />
              </div>
              <div>
                <p className="font-bold uppercase mb-1">Description (optional)</p>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="retro-input font-caveat text-lg text-blue-700 h-14 resize-none" data-testid="scrapbook-desc" />
              </div>
              <div>
                <p className="font-bold uppercase mb-1">💿 Select Jewel Case Cover:</p>
                <div className="flex gap-2 p-2 bg-[#e1e1d1] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white overflow-x-auto">
                  {COVERS.map((c) => (
                    <div key={c.id} onClick={() => setCover(c.id)} className="flex-shrink-0 cursor-pointer text-center" data-testid={`cover-${c.id}`}>
                      <img src={c.img} alt={c.label} className={`w-14 h-14 object-cover border ${cover === c.id ? "border-pink-500 border-2 ring-2 ring-pink-300" : "border-gray-600"}`} />
                      <div className={`text-[9px] mt-1 ${cover === c.id ? "bg-blue-800 text-white px-1" : "text-gray-700"}`}>{cover === c.id ? "SELECTED" : c.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {err && <div className="text-red-700 text-xs" data-testid="scrapbook-error">⚠ {err}</div>}
              <button onClick={submit} disabled={busy} className="retro-btn w-full font-vt text-lg" data-testid="scrapbook-submit">
                {busy ? "creating..." : ">> GENERATE JEWEL CASE <<"}
              </button>
            </div>
          </div>
        </RetroWindow>
      </div>
    </div>
  );
}
