import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface GameChatProps {
  gameId: string;
  currentUserId: string;
  playerNames: Record<string, string>;
}

export function GameChat({ gameId, currentUserId, playerNames }: GameChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active && data) setMessages(data);
      });

    const channel = supabase
      .channel(`chat-${gameId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `game_id=eq.${gameId}` },
        (payload) => {
          const next = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === next.id) ? prev : [...prev, next]));
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [gameId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendBody(raw: string) {
    const body = raw.trim();
    if (!body || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      game_id: gameId,
      sender_id: currentUserId,
      body,
    });
    setSending(false);
    if (error) {
      toast.error("Could not send message.");
      return;
    }
    setText("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendBody(text);
  }

  return (
    <aside className="flex h-[540px] flex-col rounded-xl border border-border bg-card lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-semibold">Game Chat</h2>
        <p className="text-xs text-muted-foreground">Ask yes or no questions to find their teacher</p>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hi or ask your first question!
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                <span className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                  {isMe ? "You" : (playerNames[m.sender_id] ?? "Friend")}
                </span>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm break-words",
                    isMe
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-secondary text-secondary-foreground"
                  )}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={sending}
            onClick={() => void sendBody("Yes!")}
          >
            Yes!
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={sending}
            onClick={() => void sendBody("No!")}
          >
            No!
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a question..."
            maxLength={300}
          />
          <Button type="submit" size="icon" disabled={sending || !text.trim()} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}