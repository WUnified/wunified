export type ProfileRecord = {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  wsu_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileDraft = {
  username: string;
  display_name?: string;
  avatar?: string | null;
};
