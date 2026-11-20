import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateRoomCode, type PlayerProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LobbyGame {
  id: string;
  room_code: string;
  host_id: string;
  guest_id: string | null;
  status: string;
  host_name: string;
}

export function LobbyPanel({ profile }: { profile: PlayerProfile }) {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [games, setGames] = useState<LobbyGame[]>([]);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  async function loadGames() {
    const { data } = await supabase
      .from("games")
      .select("id, room_code, host_id, guest_id, status")
      .order("created_at", { ascending: false })
      .limit(15);

    if (!data) return;
    const hostIds = [...new Set(data.map((g) => g.host_id))];
    const { data: profiles } = hostIds.length
      ? await supabase.from("profiles").select("id, display_name").in("id", hostIds)
      : { data: [] };

    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
    setGames(
      data.map((g) => ({
        ...g,
        host_name: nameMap.get(g.host_id) ?? "Player",
      }))
    );
  }

  useEffect(() => {
    void loadGames();
    const channel = supabase
      .channel(`lobby-games-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "games" }, () => {
        void loadGames();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function handleCreateGame() {
    setCreating(true);
    const roomCode = generateRoomCode();
    const { error } = await supabase.from("games").insert({
      room_code: roomCode,
      host_id: profile.id,
      status: "waiting",
    });
    setCreating(false);
    if (error) {
      toast.error("Could not create game. Please try again.");
      return;
    }
    void navigate({ to: "/game/$roomCode", params: { roomCode } });
  }

  async function joinRoomByCode(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      toast.error("Enter a 4-letter room code.");
      return;
    }
    setJoining(true);
    const { data: game } = await supabase
      .from("games")
      .select("id, room_code, host_id, guest_id, status")
      .eq("room_code", code)
      .maybeSingle();

    if (!game) {
      setJoining(false);
      toast.error(`No room found with code ${code}.`);
      return;
    }

    if (game.host_id !== profile.id && game.guest_id !== profile.id) {
      if (game.guest_id) {
        setJoining(false);
        toast.error("That room already has two players.");
        return;
      }
      const { error } = await supabase
        .from("games")
        .update({ guest_id: profile.id, status: "picking", updated_at: new Date().toISOString() })
        .eq("id", game.id)
        .is("guest_id", null);
      if (error) {
        setJoining(false);
        toast.error("Could not join that room.");
        return;
      }
    }

    setJoining(false);
    void navigate({ to: "/game/$roomCode", params: { roomCode: game.room_code } });
  }

  function handleJoinSubmit(e: FormEvent) {
    e.preventDefault();
    void joinRoomByCode(joinCode);
  }

  const openGames = games.filter((g) => g.status === "waiting" && !g.guest_id && g.host_id !== profile.id);
  const myGames = games.filter(
    (g) => (g.host_id === profile.id || g.guest_id === profile.id) && g.status !== "finished"
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            Kingsville Primary School
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Guess Who?</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Signed in as <strong className="text-foreground">{profile.display_name}</strong>
            {profile.username ? ` (@${profile.username})` : ""}
          </span>
          <Button variant="outline" size="sm" onClick={() => void supabase.auth.signOut()}>
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Start a new game</CardTitle>
            <CardDescription>Create a room and share the 4-letter code with a friend.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateGame} disabled={creating} className="w-full" size="lg">
              <Plus className="size-4" />
              {creating ? "Creating room..." : "Create Game Room"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Join a friend&apos;s game</CardTitle>
            <CardDescription>Type their room code to jump in and start chatting.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinSubmit} className="flex gap-2">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Room code (e.g. KPS4)"
                maxLength={6}
                className="font-semibold tracking-widest uppercase"
              />
              <Button type="submit" disabled={joining}>
                {joining ? "Joining..." : "Join"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Users className="size-4 text-primary" />
            Open rooms waiting for a player
          </h2>
          {openGames.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No open rooms right now. Create one above and share the code!
            </p>
          ) : (
            <div className="space-y-2">
              {openGames.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{g.host_name}&apos;s room</p>
                    <p className="text-xs text-muted-foreground">Code: {g.room_code}</p>
                  </div>
                  <Button size="sm" onClick={() => void joinRoomByCode(g.room_code)}>
                    Join
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Your active games</h2>
          {myGames.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              You don&apos;t have any active games yet.
            </p>
          ) : (
            <div className="space-y-2">
              {myGames.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">Room {g.room_code}</p>
                    <p className="text-xs text-muted-foreground capitalize">{g.status}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void navigate({ to: "/game/$roomCode", params: { roomCode: g.room_code } })}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}