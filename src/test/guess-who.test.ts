import { describe, expect, it } from "vitest";
import { TEACHERS, getTeacherById } from "@/data/teachers";
import { generateRoomCode, normalizeUsername, usernameToEmail, validateUsername } from "@/lib/auth";

describe("Kingsville Guess Who rules", () => {
  it("includes all 47 unique Kingsville teachers from the staff photo", () => {
    expect(TEACHERS).toHaveLength(47);
    const ids = new Set(TEACHERS.map((t) => t.id));
    expect(ids.size).toBe(47);
    expect(getTeacherById("emma")?.name).toBe("Emma");
    expect(getTeacherById("aaron")?.name).toBe("Aaron");
    expect(getTeacherById("trish")?.name).toBe("Trish");
  });

  it("normalizes usernames and derives a synthetic email with no email input needed", () => {
    expect(normalizeUsername("  Archie56 ")).toBe("archie56");
    expect(usernameToEmail("Archie56")).toBe("archie56@kingsville.local");
    expect(validateUsername("ab")).not.toBeNull();
    expect(validateUsername("archie 56")).not.toBeNull();
    expect(validateUsername("archie_56")).toBeNull();
  });

  it("generates 4-character uppercase room codes", () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z0-9]{4}$/);
  });
});