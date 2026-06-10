// Group types — designed for multi-group from day 1 (v2 will expose this)
export type GroupType = "couple" | "friends" | "family";

export type MoodState = {
  id: string;
  label: string;
  emoji: string;
  userId: string;
};
