import { useEffect, useRef, useState } from "react";

export default function Draggable({ item, onChange, onSelect, selected, children, allowRotate = true }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const [_, force] = useState(0);

  useEffect(() => {
    const move = (e) => {
      if (!drag.current) return;
      const { startX, startY, ox, oy, mode, startRot } = drag.current;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      if (mode === "move") {
        item.x = ox + (cx - startX);
        item.y = oy + (cy - startY);
      } else if (mode === "rotate") {
        const rect = ref.current.getBoundingClientRect();
        const ccx = rect.left + rect.width / 2;
        const ccy = rect.top + rect.height / 2;
        const ang = (Math.atan2(cy - ccy, cx - ccx) * 180) / Math.PI;
        item.rotation = startRot + (ang - drag.current.startAng);
      }
      force((n) => n + 1);
    };
    const up = () => {
      if (drag.current) { drag.current = null; onChange && onChange(item); }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, [item, onChange]);

  const startDrag = (e, mode) => {
    e.stopPropagation();
    onSelect && onSelect(item.id);
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    let startAng = 0;
    if (mode === "rotate" && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      startAng = (Math.atan2(cy - (rect.top + rect.height / 2), cx - (rect.left + rect.width / 2)) * 180) / Math.PI;
    }
    drag.current = { startX: cx, startY: cy, ox: item.x, oy: item.y, mode, startRot: item.rotation || 0, startAng };
  };

  return (
    <div
      ref={ref}
      className={`absolute draggable ${drag.current ? "dragging" : ""}`}
      style={{
        left: item.x, top: item.y, zIndex: item.z || 1,
        transform: `rotate(${item.rotation || 0}deg) scale(${item.scale || 1})`,
        transformOrigin: "center",
      }}
      onMouseDown={(e) => startDrag(e, "move")}
      onTouchStart={(e) => startDrag(e, "move")}
      data-testid={`item-${item.id}`}
    >
      {children}
      {selected && allowRotate && (
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-pink-500 border-2 border-white rounded-full cursor-grab shadow-md"
          onMouseDown={(e) => startDrag(e, "rotate")}
          onTouchStart={(e) => startDrag(e, "rotate")}
          title="rotate"
          data-testid={`rotate-${item.id}`}
        />
      )}
    </div>
  );
}
