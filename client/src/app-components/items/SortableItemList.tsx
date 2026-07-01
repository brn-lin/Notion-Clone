import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import axios from "axios";

import SortableItem from "./SortableItem";
import type { Item } from "../../types/item";

type SortableItemListProps = {
  items: Item[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onChange: (id: string, text: string) => void;
  onEnter: (item: Item) => void;
  onBackspace: (item: Item) => void;
  focusId: string | null;
  isDragging: boolean;
};

const SortableItemList = ({
  items,
  onOpen,
  onDelete,
  onChange,
  onEnter,
  onBackspace,
  focusId,
  isDragging,
}: SortableItemListProps) => {
  if (!Array.isArray(items)) return null;

  return (
    <SortableContext
      items={items.map((i) => i.id)}
      strategy={verticalListSortingStrategy}
    >
      {items.map((item) => (
        <SortableItem
          key={item.id}
          item={item}
          onOpen={() => onOpen(item.id)}
          onDelete={onDelete}
          onChange={onChange}
          onEnter={onEnter}
          onBackspace={onBackspace}
          focusId={focusId}
          isDragging={isDragging}
        />
      ))}
    </SortableContext>
  );
};

export default SortableItemList;
