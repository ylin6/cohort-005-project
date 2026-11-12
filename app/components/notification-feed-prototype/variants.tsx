// PROTOTYPE — throwaway. Three placements for the Notification Feed, switched
// with ?variant=A|B|C on every page inside the app layout:
//   A  Bell + popover in the sidebar header
//   B  "Notifications" sidebar item opening a right-hand drawer
//   C  "Notifications" sidebar item opening a full page in the main area
// Feed items are mocks (mock-feed.ts); read state lives in memory only.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Bell, CheckCheck, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { UserRole } from "~/db/schema";
import { mockFeedFor, timeAgo, type MockNotification } from "./mock-feed";

export const VARIANTS = [
  { key: "A", name: "Bell + popover" },
  { key: "B", name: "Sidebar item + drawer" },
  { key: "C", name: "Sidebar item + full page" },
] as const;
export type VariantKey = (typeof VARIANTS)[number]["key"];

const STORAGE_KEY = "notification-feed-prototype-variant";

/** ?variant= wins; otherwise remember the last one so NavLinks don't reset it. */
export function useVariant(): VariantKey {
  const [params] = useSearchParams();
  const fromUrl = params.get("variant") as VariantKey | null;
  const [remembered, setRemembered] = useState<VariantKey>("A");
  useEffect(() => {
    try {
      if (fromUrl) sessionStorage.setItem(STORAGE_KEY, fromUrl);
      else setRemembered((sessionStorage.getItem(STORAGE_KEY) as VariantKey) ?? "A");
    } catch {}
  }, [fromUrl]);
  return fromUrl && VARIANTS.some((v) => v.key === fromUrl) ? fromUrl : remembered;
}

// ---------- feed state ----------

interface FeedState {
  items: MockNotification[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}
const FeedContext = createContext<FeedState | null>(null);

export function FeedProvider({
  role,
  isTeamAdmin,
  children,
}: {
  role: UserRole | null;
  isTeamAdmin: boolean;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState(() => mockFeedFor(role, isTeamAdmin));
  useEffect(() => setItems(mockFeedFor(role, isTeamAdmin)), [role, isTeamAdmin]);
  const value: FeedState = {
    items,
    unread: items.filter((i) => !i.read).length,
    markRead: (id) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: true } : x))),
    markAllRead: () => setItems((xs) => xs.map((x) => ({ ...x, read: true }))),
  };
  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}
function useFeed() {
  const f = useContext(FeedContext);
  if (!f) throw new Error("FeedProvider missing");
  return f;
}

// ---------- shared bits ----------

/** Tiny **bold** / *italic* renderer for mock bodies. */
function Body({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
        ) : p.startsWith("*") ? (
          <span key={i} className="font-medium text-foreground">{p.slice(1, -1)}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function Count({ n, className }: { n: number; className?: string }) {
  if (n === 0) return null;
  return (
    <span className={cn("inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold leading-5 text-white", className)}>
      {n > 9 ? "9+" : n}
    </span>
  );
}

function Row({ item, onOpen, roomy }: { item: MockNotification; onOpen: () => void; roomy?: boolean }) {
  const { markRead } = useFeed();
  return (
    <Link
      to={item.href}
      onClick={() => {
        markRead(item.id);
        onOpen();
      }}
      className={cn(
        "flex gap-3 border-b border-border text-sm text-muted-foreground transition-colors last:border-b-0 hover:bg-accent",
        roomy ? "px-6 py-4" : "px-4 py-3",
        !item.read && "bg-primary/[0.03]"
      )}
    >
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.read ? "bg-transparent" : "bg-blue-600")} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">{item.event}</div>
        <div className="mt-0.5 leading-snug"><Body text={item.body} /></div>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground/70">{timeAgo(item.minutesAgo)}</span>
    </Link>
  );
}

function MarkAll() {
  const { unread, markAllRead } = useFeed();
  return (
    <button
      disabled={unread === 0}
      onClick={markAllRead}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
    >
      <CheckCheck className="size-3.5" /> Mark all as read
    </button>
  );
}

function Empty() {
  return <div className="px-4 py-10 text-center text-sm text-muted-foreground">You're all caught up.</div>;
}

const navItemClass =
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

// ---------- Variant A: bell + popover ----------

export function VariantAHeaderBell() {
  const { items, unread } = useFeed();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        className="relative rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <Bell className="size-4" />
        <Count n={unread} className="absolute -right-1.5 -top-1.5 min-w-4 px-1 text-[10px] leading-4" />
      </button>
      {open && (
        <div className="absolute left-full top-0 z-40 ml-3 w-96 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            <MarkAll />
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {items.length === 0 ? <Empty /> : items.map((i) => <Row key={i.id} item={i} onOpen={() => setOpen(false)} />)}
          </div>
          <div className="border-t px-4 py-2 text-right">
            <Link to="/settings" onClick={() => setOpen(false)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Notification preferences
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Variant B: sidebar item + drawer ----------

export function VariantBNavItem() {
  const { unread } = useFeed();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={navItemClass}>
        <Bell className="size-4" />
        <span className="flex-1 text-left">Notifications</span>
        <Count n={unread} />
      </button>
      {open && <Drawer onClose={() => setOpen(false)} />}
    </>
  );
}

function Drawer({ onClose }: { onClose: () => void }) {
  const { items, unread } = useFeed();
  const [tab, setTab] = useState<"unread" | "all">(unread > 0 ? "unread" : "all");
  const shown = tab === "unread" ? items.filter((i) => !i.read) : items;
  const today = shown.filter((i) => i.minutesAgo < 60 * 24);
  const earlier = shown.filter((i) => i.minutesAgo >= 60 * 24);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative flex h-full w-[26rem] flex-col border-l bg-background shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-semibold">Notifications</span>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X className="size-4" /></button>
        </div>
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs font-medium">
            {(["unread", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn("rounded px-2.5 py-1 capitalize", tab === t ? "bg-background shadow-sm" : "text-muted-foreground")}
              >
                {t}{t === "unread" && unread > 0 ? ` (${unread})` : ""}
              </button>
            ))}
          </div>
          <MarkAll />
        </div>
        <div className="flex-1 overflow-y-auto">
          {shown.length === 0 && <Empty />}
          {today.length > 0 && <Group label="Today" items={today} onOpen={onClose} />}
          {earlier.length > 0 && <Group label="Earlier" items={earlier} onOpen={onClose} />}
        </div>
        <div className="border-t px-4 py-3">
          <Link to="/settings" onClick={onClose} className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Notification preferences →
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Group({ label, items, onOpen }: { label: string; items: MockNotification[]; onOpen: () => void }) {
  return (
    <div>
      <div className="sticky top-0 bg-background/95 px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 backdrop-blur">
        {label}
      </div>
      {items.map((i) => <Row key={i.id} item={i} onOpen={onOpen} />)}
    </div>
  );
}

// ---------- Variant C: sidebar item + full page ----------

export function useFeedPageOpen() {
  const [params] = useSearchParams();
  return params.get("feed") === "page";
}

export function VariantCNavItem() {
  const { unread } = useFeed();
  const open = useFeedPageOpen();
  return (
    <Link
      to="?variant=C&feed=page"
      className={cn(navItemClass, open && "bg-sidebar-accent text-sidebar-accent-foreground")}
    >
      <Bell className="size-4" />
      <span className="flex-1">Notifications</span>
      {unread > 0 && <span className="size-2 rounded-full bg-blue-600" />}
    </Link>
  );
}

export function VariantCPage() {
  const { items, unread } = useFeed();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("All");
  const events = ["All", ...Array.from(new Set(items.map((i) => i.event)))];
  const shown = filter === "All" ? items : items.filter((i) => i.event === filter);

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "You're all caught up."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <MarkAll />
          <Link to="/settings" className="text-xs font-medium text-muted-foreground hover:text-foreground">Preferences</Link>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {events.map((e) => (
          <button
            key={e}
            onClick={() => setFilter(e)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              filter === e ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:bg-accent"
            )}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border bg-card">
        {shown.length === 0 ? <Empty /> : shown.map((i) => <Row key={i.id} item={i} roomy onOpen={() => navigate(i.href)} />)}
      </div>
    </div>
  );
}
