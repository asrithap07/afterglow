import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import Draggable from "./Draggable";
import UploadWindow from "./UploadWindow";

const newId = () => Math.random().toString(36).slice(2, 10);

function PhotoItem({ item }) {
  return (
    <div className="polaroid shadow-paper" style={{ width: item.w || 220, height: item.h || 240 }}>
      <img src={item.url} alt="" draggable={false} />
      {item.caption && <div className="caption">{item.caption}</div>}
    </div>
  );
}

export default function ScrapbookPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sb, setSb] = useState(null);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const t = useRef(null);

  useEffect(() => {
    api.getScrapbook(id).then((r) => { setSb(r); setItems(r.items || []); }).catch(() => nav("/"));
  }, [id]);

  const save = (next) => {
    setItems(next);
    clearTimeout(t.current);
    t.current = setTimeout(() => api.updateScrapbook(id, { items: next }).catch(() => {}), 600);
  };
  const onChange = (it) => save(items.map((x) => (x.id === it.id ? { ...it } : x)));
  const addSticker = (s) => save([...items, { id: newId(), type: "sticker", sticker: s, x: 250 + Math.random() * 400, y: 200 + Math.random() * 300, rotation: Math.random() * 30 - 15, z: items.length + 1 }]);
  const addNote = () => { const txt = prompt("write your note:"); if (txt) save([...items, { id: newId(), type: "note", text: txt, x: 300, y: 300, rotation: -4, z: items.length + 1 }]); };
  const addTape = () => save([...items, { id: newId(), type: "tape", x: 300, y: 250, rotation: Math.random() * 30 - 15, z: items.length + 1 }]);
  const addPaper = () => save([...items, { id: newId(), type: "paper", x: 320, y: 280, rotation: Math.random() * 10 - 5, z: items.length + 1 }]);
  const deleteSel = () => { if (!selected) return; save(items.filter((i) => i.id !== selected)); setSelected(null); };
  const bring = () => { if (!selected) return; const m = Math.max(0, ...items.map((i) => i.z || 0)); save(items.map((i) => (i.id === selected ? { ...i, z: m + 1 } : i))); };
  const back = () => { if (!selected) return; save(items.map((i) => (i.id === selected ? { ...i, z: Math.max(0, (i.z || 0) - 1) } : i))); };

  const onUploaded = ({ url, caption }) => {
    save([...items, { id: newId(), type: "photo", url, caption, x: 250 + Math.random() * 300, y: 200 + Math.random() * 200, rotation: Math.random() * 14 - 7, w: 220, h: 240, z: items.length + 1 }]);
  };

  if (!sb) return <div className="p-8 font-vt">loading scrapbook...</div>;

  return (
    <div className="min-h-screen scrapbook-bg grain relative" style={{ backgroundImage: "url(/assets/background.png)" }} onClick={() => setSelected(null)}>
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#d4d0c8] border-b-2 border-[#404040]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-3 py-1.5 gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="retro-btn" data-testid="btn-home">← HOME</Link>
            <img src="/assets/logo.png" alt="" className="h-8" />
            <div className="font-caveat text-3xl text-pink-700 font-bold" data-testid="scrapbook-title-display">{sb.title}</div>
          </div>
          <div className="flex gap-2 items-center text-xs">
            <button onClick={() => setShowUpload(true)} className="retro-btn" data-testid="btn-upload">📷 ADD PHOTO</button>
            <button onClick={() => addSticker("star")} className="retro-btn !p-1" data-testid="btn-sticker-star"><img src="/assets/star.png" className="w-5" alt="" /></button>
            <button onClick={() => addSticker("smiley")} className="retro-btn !p-1" data-testid="btn-sticker-smiley"><img src="/assets/smiley.png" className="w-5" alt="" /></button>
            <button onClick={() => addSticker("cherry")} className="retro-btn !p-1" data-testid="btn-sticker-cherry"><img src="/assets/cherry.png" className="w-5" alt="" /></button>
            <button onClick={() => addSticker("bubble")} className="retro-btn !p-1" data-testid="btn-sticker-bubble"><img src="/assets/bubble.png" className="w-5" alt="" /></button>
            <button onClick={addTape} className="retro-btn" data-testid="btn-tape">📎 TAPE</button>
            <button onClick={addPaper} className="retro-btn" data-testid="btn-paper">📄 PAPER</button>
            <button onClick={addNote} className="retro-btn" data-testid="btn-note">📝 NOTE</button>
            <div className="border-l border-[#808080] h-6 mx-1" />
            <button onClick={bring} className="retro-btn" disabled={!selected} data-testid="btn-forward">↑</button>
            <button onClick={back} className="retro-btn" disabled={!selected} data-testid="btn-back">↓</button>
            <button onClick={deleteSel} className="retro-btn" disabled={!selected} data-testid="btn-delete">✕</button>
          </div>
        </div>
      </div>

      {/* spread background paper */}
      <div className="pt-20 px-6">
        <div className="font-caveat text-2xl text-blue-700 ml-4">{sb.description}</div>
      </div>

      <div className="relative" style={{ minHeight: "180vh" }} data-testid="scrapbook-canvas">
        {items.map((it) => (
          <Draggable key={it.id} item={it} onChange={onChange} onSelect={setSelected} selected={selected === it.id}>
            {it.type === "photo" && <PhotoItem item={it} />}
            {it.type === "sticker" && <img src={`/assets/${it.sticker}.png`} className="w-24" alt="" draggable={false} />}
            {it.type === "note" && (
              <div className="relative w-48">
                <img src="/assets/paper.png" alt="" draggable={false} className="w-full" />
                <div className="absolute inset-0 p-6 font-caveat text-blue-700 text-xl leading-tight">{it.text}</div>
              </div>
            )}
            {it.type === "paper" && <img src="/assets/paper.png" alt="" draggable={false} className="w-72 opacity-95" />}
            {it.type === "tape" && <div style={{ width: 90, height: 24, background: "rgba(255,220,150,0.7)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />}
          </Draggable>
        ))}
        {items.length === 0 && (
          <div className="absolute top-40 left-1/2 -translate-x-1/2 font-caveat text-4xl text-pink-600">this scrapbook is empty ↑ start adding stuff!</div>
        )}
      </div>

      {showUpload && <UploadWindow scrapbooks={[]} defaultTarget={id} onClose={() => setShowUpload(false)} onUploaded={onUploaded} />}
    </div>
  );
}
