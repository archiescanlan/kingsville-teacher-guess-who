import { createFileRoute } from "@tanstack/react-router";
import { AuthPanel } from "@/components/AuthPanel";
import { LobbyPanel } from "@/components/LobbyPanel";
import { TeacherPortrait } from "@/components/TeacherPortrait";
import { TEACHERS } from "@/data/teachers";
import { useAuthSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kingsville Primary School — Guess Who?" },
      {
        name: "description",
        content: "Log in, chat live, and play Guess Who with the Kingsville Primary School teachers.",
      },
      { property: "og:title", content: "Kingsville Primary School — Guess Who?" },
      {
        property: "og:description",
        content: "Log in, chat live, and play Guess Who with the Kingsville Primary School teachers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PREVIEW_TEACHERS = TEACHERS.slice(0, 6);

function Index() {
  const { user, profile, loading } = useAuthSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user && profile) {
    return (
      <main className="min-h-screen bg-background">
        <LobbyPanel profile={profile} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-4 py-12 lg:grid-cols-2">
        <section className="space-y-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              Kingsville Primary School
            </p>
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
              Guess Who?
            </h1>
            <p className="mt-3 max-w-md text-base text-muted-foreground">
              Pick a secret teacher, text yes-or-no questions to your friend, and flip down cards until you guess who they chose.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 lg:grid-cols-3">
            {PREVIEW_TEACHERS.map((teacher) => (
              <div
                key={teacher.id}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card p-1.5 text-center shadow-xs"
              >
                <TeacherPortrait teacher={teacher} className="rounded-lg" />
                <span className="mt-1 truncate text-xs font-bold text-primary">{teacher.name}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-center lg:justify-end">
          <AuthPanel />
        </div>
      </div>
    </main>
  );
}
