import staffSheet from "@/assets/kingsville-teachers.png.asset.json";
import { STAFF_SHEET_HEIGHT, STAFF_SHEET_WIDTH, type Teacher } from "@/data/teachers";
import { cn } from "@/lib/utils";

interface TeacherPortraitProps {
  teacher: Teacher;
  className?: string;
}

export function TeacherPortrait({ teacher, className }: TeacherPortraitProps) {
  const [x, y, w, h] = teacher.crop;
  const bgSizeX = (STAFF_SHEET_WIDTH / w) * 100;
  const bgSizeY = (STAFF_SHEET_HEIGHT / h) * 100;
  const bgPosX = (x / (STAFF_SHEET_WIDTH - w)) * 100;
  const bgPosY = (y / (STAFF_SHEET_HEIGHT - h)) * 100;

  return (
    <div
      role="img"
      aria-label={teacher.name}
      className={cn("w-full overflow-hidden bg-muted bg-no-repeat", className)}
      style={{
        aspectRatio: `${w} / ${h}`,
        backgroundImage: `url(${staffSheet.url})`,
        backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
      }}
    />
  );
}