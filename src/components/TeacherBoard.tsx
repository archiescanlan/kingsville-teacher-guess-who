import { Check } from "lucide-react";
import { TEACHERS, type Teacher } from "@/data/teachers";
import { TeacherPortrait } from "@/components/TeacherPortrait";
import { cn } from "@/lib/utils";

interface TeacherBoardProps {
  mode: "pick" | "play" | "guess";
  eliminatedIds?: Set<string>;
  selectedId?: string | null;
  onSelectTeacher: (teacher: Teacher) => void;
}

export function TeacherBoard({
  mode,
  eliminatedIds,
  selectedId,
  onSelectTeacher,
}: TeacherBoardProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-7">
      {TEACHERS.map((teacher) => {
        const isEliminated = mode === "play" && (eliminatedIds?.has(teacher.id) ?? false);
        const isSelected = selectedId === teacher.id;

        return (
          <button
            key={teacher.id}
            type="button"
            onClick={() => onSelectTeacher(teacher)}
            aria-pressed={mode === "play" ? isEliminated : isSelected}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-xl border bg-card p-1.5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isEliminated
                ? "border-border/60 opacity-35 grayscale hover:opacity-55"
                : "border-border hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm",
              isSelected && "border-primary ring-2 ring-primary/30"
            )}
          >
            <div className="relative w-full overflow-hidden rounded-lg">
              <TeacherPortrait teacher={teacher} />
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Check className="size-3.5" />
                </span>
              )}
            </div>
            <span
              className={cn(
                "mt-1.5 truncate text-xs font-bold text-primary",
                isEliminated && "line-through text-muted-foreground"
              )}
            >
              {teacher.name}
            </span>
            <span className="truncate text-[10px] leading-tight text-muted-foreground">
              {teacher.role}
            </span>
          </button>
        );
      })}
    </div>
  );
}