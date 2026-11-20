import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface PlayerProfile {
  id: string;
  username: string | null;
  display_name: string;
}

const USERNAME_PATTERN = /^[a-z0-9._-]{3,24}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): string | null {
  const normalized = normalizeUsername(raw);
  if (!normalized) return "Please enter a username.";
  if (normalized.length < 3 || normalized.length > 24) {
    return "Username must be 3 to 24 characters.";
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return "Use only letters, numbers, dots, dashes, or underscores.";
  }
  return null;
}

export function usernameToEmail(raw: string): string {
  return `${normalizeUsername(raw)}@kingsville.local`;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)] ?? "K";
  }
  return code;
}

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile(u: User | null) {
      if (!u) {
        if (active) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("id", u.id)
        .maybeSingle();

      if (active) {
        setUser(u);
        setProfile(
          data ?? {
            id: u.id,
            username: typeof u.user_metadata?.["username"] === "string" ? u.user_metadata["username"] : null,
            display_name:
              typeof u.user_metadata?.["display_name"] === "string"
                ? u.user_metadata["display_name"]
                : "Player",
          }
        );
        setLoading(false);
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      void loadProfile(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}