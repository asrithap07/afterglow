export default function RetroWindow({ title = "WINDOW", onClose, children, className = "", width = "max-w-2xl" }) {
  return (
    <div className={`win-panel ${width} w-full ${className}`} data-testid="retro-window">
      <div className="bg-[#ffb6c1] h-6 flex items-center justify-end px-1 gap-1 border-b border-[#404040]">
        <button className="win-btn" data-testid="win-minimize">_</button>
        <button className="win-btn" data-testid="win-maximize">▢</button>
        <button className="win-btn" onClick={onClose} data-testid="win-close">X</button>
      </div>
      <div className="win-titlebar"><span className="tracking-wide">{title}</span></div>
      <div className="flex gap-4 px-2 py-1 text-xs border-b border-[#808080] bg-[#d4d0c8]">
        <span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>H</u>elp</span>
      </div>
      <div className="p-4 bg-[#d4d0c8] text-black">{children}</div>
    </div>
  );
}
