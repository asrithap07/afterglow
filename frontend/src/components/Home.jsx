import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import Draggable from "./Draggable";
import UploadWindow from "./UploadWindow";
import ScrapbookWindow from "./ScrapbookWindow";

const STICKERS = ["star", "bubble", "cherry", "smiley"];
const CD_IMG = { polkadot: "/assets/cd-polkadot.jpeg", rainbow: "/assets/cd-rainbow.jpeg", iridescent: "/assets/cd-polkadot.jpeg", glitter: "/assets/cd-rainbow.jpeg" };

const newId = () => Math.random().toString(36).slice(2, 10);

function PhotoItem({ item }) {
  return (
    <div className="polaroid shadow-paper" style={{ width: item.w || 200, height: item.h || 220 }}>
      <img src={item.url} alt="" draggable={false} />
      {item.caption && <div className="caption">{item.caption}</div>}
    </div>
  );
}
function StickerItem({ item }) {
  return <img src={`/assets/${item.sticker}.png`} alt="" className="w-24 pointer-events-none" draggable={false} />;
}
function NoteItem({ item }) {
  return (
    <div className="relative">
      <img src="/assets/paper.png" alt="" className="w-48" draggable={false} />
      <div className="absolute inset-0 p-6 font-caveat text-blue-700 text-xl leading-tight">{item.text}</div>
    </div>
  );
}

export default function Home() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [scrapbooks, setScrapbooks] = useState([]);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showNewBook, setShowNewBook] = useState(false);
  const saveTimer = useRef(null);

  const reload = async () => {
    const [sbs, home] = await Promise.all([api.listScrapbooks(), api.getHome()]);
    setScrapbooks(sbs);
    setItems(home.items || []);
  };
  useEffect(() => { reload(); }, []);

  const saveItems = (next) => {
    setItems(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => api.updateHome(next).catch(() => {}), 600);
  };

  const onChange = (it) => saveItems(items.map((x) => (x.id === it.id ? { ...it } : x)));
  const onSelect = (id) => setSelected(id);
  const bringForward = () => { if (!selected) return; const max = Math.max(0, ...items.map((i) => i.z || 0)); saveItems(items.map((i) => (i.id === selected ? { ...i, z: max + 1 } : i))); };
  const sendBack = () => { if (!selected) return; saveItems(items.map((i) => (i.id === selected ? { ...i, z: Math.max(0, (i.z || 0) - 1) } : i))); };
  const deleteSel = () => { if (!selected) return; saveItems(items.filter((i) => i.id !== selected)); setSelected(null); };

  const addSticker = (s) => saveItems([...items, { id: newId(), type: "sticker", sticker: s, x: 200 + Math.random() * 400, y: 200 + Math.random() * 300, rotation: Math.random() * 30 - 15, z: items.length + 1 }]);
  const addNote = () => {
    const text = prompt("write your note:");
    if (text) saveItems([...items, { id: newId(), type: "note", text, x: 250 + Math.random() * 400, y: 250 + Math.random() * 300, rotation: Math.random() * 12 - 6, z: items.length + 1 }]);
  };

  const onUploaded = async ({ url, caption, target }) => {
    if (target === "home") {
      saveItems([...items, { id: newId(), type: "photo", url, caption, x: 300 + Math.random() * 300, y: 200 + Math.random() * 200, rotation: Math.random() * 16 - 8, w: 220, h: 240, z: items.length + 1 }]);
    } else {
      const sb = await api.getScrapbook(target);
      const its = sb.items || [];
      its.push({ id: newId(), type: "photo", url, caption, x: 200, y: 200, rotation: 0, w: 220, h: 240, z: its.length + 1 });
      await api.updateScrapbook(target, { items: its });
      nav(`/scrapbook/${target}`);
    }
  };

  // CD positions in a chaotic cluster on the right side
  const cdPositions = useMemo(() => scrapbooks.map((_, i) => ({
    left: 20 + (i % 2) * 140 + Math.random() * 20,
    top: 60 + Math.floor(i / 2) * 200 + Math.random() * 30,
    rot: (Math.random() - 0.5) * 24,
  })), [scrapbooks.length]);

  return (
    <div className="min-h-screen scrapbook-bg grain relative" style={{ backgroundImage: "url(/assets/background.png)" }} onClick={() => setSelected(null)}>
      {/* Top toolbar - retro */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#d4d0c8] border-b-2 border-[#404040] shadow-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-3 py-1.5 gap-3">
          <img src="/assets/logo.png" alt="afterglow" className="h-10" data-testid="header-logo" />
          <div className="flex gap-2 items-center text-xs">
            <button onClick={() => setShowUpload(true)} className="retro-btn" data-testid="btn-upload">📷 UPLOAD PHOTO</button>
            <button onClick={() => setShowNewBook(true)} className="retro-btn" data-testid="btn-new-scrapbook">💿 NEW SCRAPBOOK</button>
            <div className="border-l border-[#808080] h-6 mx-1" />
            <button onClick={() => addSticker("star")} className="retro-btn !p-1" title="add star sticker" data-testid="btn-sticker-star"><img src="/assets/star.png" className="w-5 h-5" alt="" /></button>
            <button onClick={() => addSticker("smiley")} className="retro-btn !p-1" data-testid="btn-sticker-smiley"><img src="/assets/smiley.png" className="w-5 h-5" alt="" /></button>
            <button onClick={() => addSticker("cherry")} className="retro-btn !p-1" data-testid="btn-sticker-cherry"><img src="/assets/cherry.png" className="w-5 h-5" alt="" /></button>
            <button onClick={() => addSticker("bubble")} className="retro-btn !p-1" data-testid="btn-sticker-bubble"><img src="/assets/bubble.png" className="w-5 h-5" alt="" /></button>
            <button onClick={addNote} className="retro-btn" data-testid="btn-note">📝 NOTE</button>
            <div className="border-l border-[#808080] h-6 mx-1" />
            <button onClick={bringForward} className="retro-btn" data-testid="btn-forward" disabled={!selected}>↑</button>
            <button onClick={sendBack} className="retro-btn" data-testid="btn-back" disabled={!selected}>↓</button>
            <button onClick={deleteSel} className="retro-btn" data-testid="btn-delete" disabled={!selected}>✕</button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-vt text-base">hi, {user?.name || user?.email}</span>
            <button onClick={logout} className="retro-btn" data-testid="btn-logout">LOGOUT</button>
          </div>
        </div>
      </div>

      {/* Decorative anchors */}
      <img src="/assets/nokia.png" alt="" className="absolute z-[2] pointer-events-none" style={{ top: 110, left: 40, width: 220, transform: "rotate(-8deg)" }} />
      <img src="/assets/digicam.png" alt="" className="absolute z-[2] pointer-events-none" style={{ top: 380, left: 80, width: 180, transform: "rotate(6deg)" }} />
      <img src="/assets/bubble.png" alt="" className="absolute z-[1] pointer-events-none opacity-90" style={{ top: 600, left: 30, width: 200 }} />
      <img src="/assets/star.png" alt="" className="absolute z-[3] pointer-events-none" style={{ top: 200, right: 240, width: 70, transform: "rotate(15deg)" }} />
      <img src="/assets/cherry.png" alt="" className="absolute z-[3] pointer-events-none" style={{ top: 480, left: 350, width: 90, transform: "rotate(-10deg)" }} />
      <img src="/assets/smiley.png" alt="" className="absolute z-[3] pointer-events-none" style={{ top: 700, right: 380, width: 80 }} />

      {/* Big handwritten title */}
      <div className="absolute z-[4] pointer-events-none" style={{ top: 90, left: 320, transform: "rotate(-3deg)" }}>
        <div className="font-caveat text-7xl text-pink-600 font-bold drop-shadow-md">my afterglow ♡</div>
        <div className="font-caveat text-2xl text-blue-700 mt-1 ml-4">a scrapbook of everything</div>
      </div>

      {/* CD shelf - scrapbooks */}
      <div className="absolute right-8 top-24 z-[5] w-[340px]" onClick={(e) => e.stopPropagation()}>
        <div className="font-vt text-2xl text-white drop-shadow-lg mb-2 px-2 bg-pink-500 inline-block">▼ MY SCRAPBOOKS</div>
        <div className="relative" style={{ height: scrapbooks.length * 110 + 60 }}>
          {scrapbooks.map((sb, i) => {
            const pos = cdPositions[i] || { left: 20, top: 60 + i * 120, rot: 0 };
            return (
              <Link key={sb.id} to={`/scrapbook/${sb.id}`} className="cd-case absolute" style={{ left: pos.left, top: pos.top, transform: `rotate(${pos.rot}deg)` }} data-testid={`cd-${sb.id}`}>
                <div className="relative w-32 h-32">
                  <img src={CD_IMG[sb.cover_style] || CD_IMG.polkadot} alt="" className="cd-disc w-full h-full object-cover shadow-paper" />
                </div>
                <div className="font-caveat text-xl text-pink-700 mt-1 text-center max-w-32 leading-tight">{sb.title}</div>
              </Link>
            );
          })}
          {scrapbooks.length === 0 && (
            <div className="font-caveat text-2xl text-pink-600 mt-12 ml-2">no scrapbooks yet — click NEW SCRAPBOOK ↑</div>
          )}
        </div>
      </div>

      {/* Canvas items */}
      <div className="relative pt-20" style={{ minHeight: "180vh" }}>
        {items.map((it) => (
          <Draggable key={it.id} item={it} onChange={onChange} onSelect={onSelect} selected={selected === it.id}>
            {it.type === "photo" && <PhotoItem item={it} />}
            {it.type === "sticker" && <StickerItem item={it} />}
            {it.type === "note" && <NoteItem item={it} />}
          </Draggable>
        ))}
      </div>

      {/* Floating decorative paper scrap */}
      <div className="absolute z-[2] pointer-events-none" style={{ top: 900, left: 200, transform: "rotate(4deg)" }}>
        <img src="/assets/paper.png" alt="" className="w-72 shadow-paper" />
        <div className="absolute inset-0 p-10 font-caveat text-blue-700 text-2xl leading-tight">click around. drag things. it's your scrapbook ♡</div>
      </div>

      {showUpload && <UploadWindow scrapbooks={scrapbooks} onClose={() => setShowUpload(false)} onUploaded={onUploaded} />}
      {showNewBook && <ScrapbookWindow onClose={() => setShowNewBook(false)} onCreated={(sb) => setScrapbooks([sb, ...scrapbooks])} />}
    </div>
  );
}
