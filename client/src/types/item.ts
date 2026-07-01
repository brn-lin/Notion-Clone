export type BaseItem = {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  position: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  trashed_by_id: string | null;
};

export type PageContent = {};

export type BlockContent = {
  text: string;
};

export type PageItemType = BaseItem & {
  type: "page";
  title: string | null;
  content: PageContent;
};

export type BlockItemType = BaseItem & {
  type: "block";
  title: null;
  content: BlockContent;
};

export type Item = PageItemType | BlockItemType;

export type TrashedItem = Item & {
  deleted_at: string; // deleted_at is always a string in Trash
};
