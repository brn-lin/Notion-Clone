export type ItemType = "page" | "block";

export type Item = {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  type: ItemType;
  title: string | null;
  content: Record<string, unknown>;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  trashed_by_id: string | null;
};

export type TrashedItem = Item & {
  deleted_at: string; // deleted_at is always a string in Trash
};
