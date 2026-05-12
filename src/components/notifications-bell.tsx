import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface Notif {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,link,read,created_at")
        .order("created_at", { ascending: false })
        .limit(15);
      if (active) setItems(data ?? []);
    };
    load();
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [user]);

  if (!user) return null;
  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((xs) => xs.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((v) => !v); if (!open && unread) markAllRead(); }}
        className="relative inline-flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold text-accent-foreground">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-h-96 overflow-auto bg-card border border-border shadow-lg">
          <div className="p-3 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Notifications</div>
          {items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">All quiet on the farm.</p>
          ) : items.map((n) => {
            const inner = (
              <>
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="font-mono text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("en-IN")}</p>
              </>
            );
            const cls = "block p-3 border-b border-border hover:bg-muted/50";
            return n.link ? (
              <Link key={n.id} to={n.link as string} onClick={() => setOpen(false)} className={cls}>{inner}</Link>
            ) : (
              <div key={n.id} className={cls}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
