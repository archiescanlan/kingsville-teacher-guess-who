import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, RotateCcw, Shuffle, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getRandomTeacher, getTeacherById, TEACHERS, type Teacher } from "@/data/teachers";
import { useAuthSession } from "@/lib/auth";
import { TeacherBoard } from "@/components/TeacherBoard";
import { TeacherPortrait } from "@/components/TeacherPortrait";
import { GameChat } from "@/components/GameChat";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GameRecord {
  id: string;
  room_code: string;
  host_id: string;
  guest_id: string | null;
  host_secret_teacher: string | null;
  guest_secret_teacher: string | null;
  status: string;
  winner_id: string | null;
  last_guess_by: string | null;
  last_guess_teacher: string | null;
}

export const Route = createFileRoute("/game/$roomCode")({
  head: ({ params }) => ({
    meta: [
      { title: `Room ${params.roomCode.toUpperCase()} — Kingsville Guess Who?` },
      {
        name: "description",
        content: "Play Guess Who live with Kingsville Primary School teachers and text chat.",
      },
      { property: "og:title", content: `Room ${params.roomCode.toUpperCase()} — Kingsville Guess Who?` },
      {
        property: "og:description",
        content: "Play Guess Who live with Kingsville Primary School teachers and text chat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GameRoomPage,
});

function GameRoomPage() {
  const { roomCode } = Route.useParams();
  const normalizedCode = roomCode.toUpperCase();
  const { user, loading: authLoading } = useAuthSession();

  const [game, setGame] = useState<GameRecord | null>(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());
  const [guessOpen, setGuessOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const storageKey = `kps-guesswho-elim-${normalizedCode}`;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEliminatedIds(new Set(parsed.filter((v): v is string => typeof v === "string")));
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKey]);

  function saveEliminated(next: Set<string>) {
    setEliminatedIds(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch {
      // ignore storage errors
    }
  }

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function fetchGame() {
      const { data } = await supabase
        .from("games")
        .select(
          "id, room_code, host_id, guest_id, host_secret_teacher, guest_secret_teacher, status, winner_id, last_guess_by, last_guess_teacher"
        )
        .eq("room_code", normalizedCode)
        .maybeSingle();

      if (!active) return;
      setGame(data);
      setLoadingGame(false);
    }

    void fetchGame();

    const channel = supabase
      .channel(`game-${normalizedCode}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `room_code=eq.${normalizedCode}` },
        (payload) => {
          if (payload.new && typeof payload.new === "object" && "id" in payload.new) {
            setGame(payload.new as GameRecord);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [normalizedCode, user]);

  useEffect(() => {
    if (!game) return;
    const ids = [game.host_id, game.guest_id].filter((v): v is string => Boolean(v));
    if (ids.length === 0) return;
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ids)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        for (const p of data) map[p.id] = p.display_name;
        setPlayerNames(map);
      });
  }, [game?.host_id, game?.guest_id]);

  const isHost = Boolean(user && game && game.host_id === user.id);
  const isGuest = Boolean(user && game && game.guest_id === user.id);
  const isParticipant = isHost || isGuest;

  const mySecretId = isHost ? game?.host_secret_teacher : game?.guest_secret_teacher;
  const opponentSecretId = isHost ? game?.guest_secret_teacher : game?.host_secret_teacher;
  const opponentId = isHost ? game?.guest_id : game?.host_id;
  const mySecretTeacher = useMemo(() => getTeacherById(mySecretId), [mySecretId]);
  const opponentSecretTeacher = useMemo(() => getTeacherById(opponentSecretId), [opponentSecretId]);

  async function handlePickSecret(teacher: Teacher) {
    if (!game || !isParticipant || busy) return;
    setBusy(true);
    const otherPicked = isHost ? Boolean(game.guest_secret_teacher) : Boolean(game.host_secret_teacher);
    const nextStatus = game.guest_id && otherPicked ? "playing" : game.guest_id ? "picking" : "waiting";
    const patch = isHost
      ? { host_secret_teacher: teacher.id, status: nextStatus, updated_at: new Date().toISOString() }
      : { guest_secret_teacher: teacher.id, status: nextStatus, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from("games")
      .update(patch)
      .eq("id", game.id)
      .select()
      .single();
    setBusy(false);
    if (error) {
      toast.error("Could not save your secret teacher.");
      return;
    }
    if (data) setGame(data);
    toast.success(`Your secret teacher is ${teacher.name}!`);
  }

  function handleToggleEliminate(teacher: Teacher) {
    const next = new Set(eliminatedIds);
    if (next.has(teacher.id)) next.delete(teacher.id);
    else next.add(teacher.id);
    saveEliminated(next);
  }

  async function handleMakeGuess(teacher: Teacher) {
    if (!game || !user || !opponentId || !opponentSecretId || busy) return;
    setBusy(true);
    const isCorrect = teacher.id === opponentSecretId;
    const winnerId = isCorrect ? user.id : opponentId;

    const { data, error } = await supabase
      .from("games")
      .update({
        status: "finished",
        winner_id: winnerId,
        last_guess_by: user.id,
        last_guess_teacher: teacher.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", game.id)
      .select()
      .single();

    setBusy(false);
    setGuessOpen(false);
    if (error) {
      toast.error("Could not submit your guess.");
      return;
    }
    if (data) setGame(data);
  }

  async function handlePlayAgain() {
    if (!game || busy) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("games")
      .update({
        host_secret_teacher: null,
        guest_secret_teacher: null,
        status: game.guest_id ? "picking" : "waiting",
        winner_id: null,
        last_guess_by: null,
        last_guess_teacher: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", game.id)
      .select()
      .single();
    setBusy(false);
    if (error) {
      toast.error("Could not start a new round.");
      return;
    }
    saveEliminated(new Set());
    if (data) setGame(data);
  }

  function handleCopyCode() {
    void navigator.clipboard?.writeText(normalizedCode);
    toast.success(`Copied room code ${normalizedCode}`);
  }

  if (authLoading || loadingGame) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading game room...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <h1 className="text-2xl font-bold">Log in to join room {normalizedCode}</h1>
        <Button asChild>
          <Link to="/">Go to login</Link>
        </Button>
      </div>
    );
  }

  if (!game || !isParticipant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <h1 className="text-2xl font-bold">Room {normalizedCode} isn&apos;t available</h1>
        <p className="text-sm text-muted-foreground">
          It may already have two players, or the code doesn&apos;t exist.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back to lobby</Link>
        </Button>
      </div>
    );
  }

  const opponentName = opponentId ? (playerNames[opponentId] ?? "Friend") : "Waiting for a friend...";
  const remainingCount = TEACHERS.length - eliminatedIds.size;
  const needsToPick = game.status !== "finished" && !mySecretTeacher;
  const waitingForOpponent = game.status !== "finished" && Boolean(mySecretTeacher) && game.status !== "playing";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-4">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="size-4" />
                Lobby
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold">Room {game.room_code}</span>
                <Button variant="outline" size="sm" onClick={handleCopyCode} className="h-7 px-2 text-xs">
                  <Copy className="size-3.5" />
                  Copy code
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Playing with: {opponentName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {mySecretTeacher && (
              <div className="flex items-center gap-2.5 rounded-lg border border-primary/30 bg-accent px-2.5 py-1.5">
                <div className="w-9 shrink-0 overflow-hidden rounded-md">
                  <TeacherPortrait teacher={mySecretTeacher} />
                </div>
                <div className="pr-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Your teacher</p>
                  <p className="text-sm font-bold text-primary">{mySecretTeacher.name}</p>
                </div>
              </div>
            )}

            {game.status === "playing" && (
              <>
                <span className="text-xs font-medium text-muted-foreground">
                  {remainingCount} of {TEACHERS.length} left
                </span>
                <Button variant="outline" size="sm" onClick={() => saveEliminated(new Set())}>
                  <RotateCcw className="size-3.5" />
                  Reset board
                </Button>
                <Button size="sm" onClick={() => setGuessOpen(true)}>
                  Make a Guess
                </Button>
              </>
            )}
          </div>
        </header>

        {game.status === "finished" && (
          <section className="mb-5 rounded-xl border border-primary/30 bg-accent/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="size-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">
                    {game.winner_id === user.id
                      ? "You won this round!"
                      : `${playerNames[game.winner_id ?? ""] ?? "Your friend"} won this round!`}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {playerNames[game.last_guess_by ?? ""] ?? "A player"} guessed{" "}
                    <strong>{getTeacherById(game.last_guess_teacher)?.name ?? "a teacher"}</strong>.
                  </p>
                </div>
              </div>
              <Button onClick={handlePlayAgain} disabled={busy}>
                Play Again
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              {mySecretTeacher && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
                  <div className="w-14 overflow-hidden rounded-md">
                    <TeacherPortrait teacher={mySecretTeacher} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Your secret teacher</p>
                    <p className="font-bold text-primary">{mySecretTeacher.name}</p>
                  </div>
                </div>
              )}
              {opponentSecretTeacher && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
                  <div className="w-14 overflow-hidden rounded-md">
                    <TeacherPortrait teacher={opponentSecretTeacher} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{opponentName}&apos;s secret teacher</p>
                    <p className="font-bold text-primary">{opponentSecretTeacher.name}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <section>
            {needsToPick ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3">
                <div>
                  <h1 className="text-base font-bold">Step 1: Pick your secret teacher</h1>
                  <p className="text-xs text-muted-foreground">
                    Click any Kingsville teacher below, or pick one at random.
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void handlePickSecret(getRandomTeacher())}>
                  <Shuffle className="size-3.5" />
                  Pick Random Teacher
                </Button>
              </div>
            ) : waitingForOpponent ? (
              <div className="mb-4 rounded-xl border border-border bg-secondary/50 px-4 py-3">
                <h1 className="text-base font-bold">
                  {game.guest_id
                    ? `Waiting for ${opponentName} to pick their secret teacher...`
                    : `Share room code ${game.room_code} with a friend so they can join!`}
                </h1>
              </div>
            ) : null}

            <TeacherBoard
              mode={needsToPick ? "pick" : "play"}
              eliminatedIds={eliminatedIds}
              selectedId={needsToPick ? (mySecretId ?? null) : null}
              onSelectTeacher={(teacher) => {
                if (needsToPick) void handlePickSecret(teacher);
                else if (game.status === "playing") handleToggleEliminate(teacher);
              }}
            />
          </section>

          <GameChat gameId={game.id} currentUserId={user.id} playerNames={playerNames} />
        </div>
      </div>

      <Dialog open={guessOpen} onOpenChange={setGuessOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Who is {opponentName}&apos;s secret teacher?</DialogTitle>
            <DialogDescription>
              Click the teacher you want to guess. A right guess wins the round; a wrong guess gives the win to {opponentName}!
            </DialogDescription>
          </DialogHeader>
          <TeacherBoard mode="guess" onSelectTeacher={(t) => void handleMakeGuess(t)} />
        </DialogContent>
      </Dialog>
    </main>
  );
}