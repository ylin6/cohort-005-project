// PROTOTYPE — throwaway. Floating bottom bar that cycles ?variant= values.
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PrototypeSwitcher({
  variants,
  current,
}: {
  variants: readonly { key: string; name: string }[];
  current: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const index = Math.max(0, variants.findIndex((v) => v.key === current));

  function go(delta: number) {
    const next = variants[(index + delta + variants.length) % variants.length];
    const params = new URLSearchParams(location.search);
    params.set("variant", next.key);
    params.delete("feed");
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (import.meta.env.PROD) return null;
  const v = variants[index];
  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full bg-fuchsia-600 px-1.5 py-1 text-sm font-medium text-white shadow-lg ring-2 ring-white/40">
      <button onClick={() => go(-1)} className="rounded-full p-1 hover:bg-white/20" title="Previous variant (←)">
        <ChevronLeft className="size-4" />
      </button>
      <span className="px-2 tabular-nums">
        {v.key} <span className="opacity-80">({v.name})</span>
      </span>
      <button onClick={() => go(1)} className="rounded-full p-1 hover:bg-white/20" title="Next variant (→)">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
