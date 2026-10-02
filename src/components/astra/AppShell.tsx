import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Brain, LogOut, Shield, Menu, MessageSquare, Plus, Search, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { threadsQuery } from "@/lib/astra/data";
import { AstraWordmark } from "./Mark";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const ShellCtx = createContext<{ openMenu: () => void; openCommand: () => void }>({
  openMenu: () => {},
  openCommand: () => {},
});
export const useShell = () => useContext(ShellCtx);

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        navigate({ to: "/chat" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <ShellCtx.Provider value={{ openMenu: () => setMobileOpen(true), openCommand: () => setCmdOpen(true) }}>
      <div className="flex h-dvh overflow-hidden bg-background">
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex">
          <SidebarBody onNavigate={() => {}} onSearch={() => setCmdOpen(true)} />
        </aside>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[82vw] max-w-72 border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarBody
              onNavigate={() => setMobileOpen(false)}
              onSearch={() => {
                setMobileOpen(false);
                setCmdOpen(true);
              }}
            />
          </SheetContent>
        </Sheet>
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </ShellCtx.Provider>
  );
}

export function MobileMenuButton() {
  const { openMenu } = useShell();
  return (
    <button onClick={openMenu} className="-ml-1 rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden" aria-label="Open menu">
      <Menu className="size-5" />
    </button>
  );
}

function SidebarBody({ onNavigate, onSearch }: { onNavigate: () => void; onSearch: () => void }) {
  const { data: threads } = useQuery(threadsQuery);
  const { user } = useAuth();
  const params = useParams({ strict: false }) as { threadId?: string };
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function remove(id: string) {
    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) { toast.error("Couldn't delete that chat"); return; }
    qc.invalidateQueries({ queryKey: ["threads"] });
    if (params.threadId === id) navigate({ to: "/chat" });
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link to="/chat" onClick={onNavigate}>
          <AstraWordmark />
        </Link>
      </div>
      <div className="space-y-1 px-2">
        <Link
          to="/chat"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md border border-sidebar-border px-3 py-2 text-sm hover:bg-sidebar-accent"
        >
          <Plus className="size-4" /> New chat
          <kbd className="ml-auto label-mono">⇧⌘O</kbd>
        </Link>
        <button onClick={onSearch} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent">
          <Search className="size-4" /> Search
          <kbd className="ml-auto label-mono">⌘K</kbd>
        </button>
      </div>
      <div className="mt-5 px-4 label-mono">Chats</div>
      <nav className="mt-1 flex-1 overflow-y-auto px-2 pb-2">
        {threads?.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No chats yet.</p>}
        {threads?.map((t) => (
          <div
            key={t.id}
            className={cn(
              "group flex items-center rounded-md text-sm hover:bg-sidebar-accent",
              params.threadId === t.id && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <Link
              to="/chat/$threadId"
              params={{ threadId: t.id }}
              onClick={onNavigate}
              className="min-w-0 flex-1 truncate px-3 py-2"
            >
              {t.title}
            </Link>
            <button
              onClick={() => remove(t.id)}
              className="mr-1 rounded p-1.5 text-muted-foreground opacity-100 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
              aria-label="Delete chat"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </nav>
      <div className="space-y-0.5 border-t border-sidebar-border p-2">
        <Link to="/memory" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}>
          <Brain className="size-4" /> Memory
        </Link>
        <Link to="/settings" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}>
          <Settings className="size-4" /> Settings
        </Link>
        <AdminLink onNavigate={onNavigate} />
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{user?.email}</span>
          <button onClick={() => supabase.auth.signOut()} className="text-muted-foreground hover:text-foreground" aria-label="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: threads } = useQuery(threadsQuery);
  const navigate = useNavigate();
  const go = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search chats or jump to…" />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go(() => navigate({ to: "/chat" }))}>
            <Plus /> New chat
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/memory" }))}>
            <Brain /> Memory
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/settings" }))}>
            <Settings /> Settings
          </CommandItem>
        </CommandGroup>
        {!!threads?.length && (
          <CommandGroup heading="Chats">
            {threads.map((t) => (
              <CommandItem key={t.id} value={`${t.title} ${t.id}`} onSelect={() => go(() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } }))}>
                <MessageSquare /> {t.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function AdminLink({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { user } = useAuth();
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" })).data ?? false,
  });
  if (!isAdmin) return null;
  return (
    <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent" }}>
      <Shield className="size-4" /> Dev dashboard
    </Link>
  );
}
