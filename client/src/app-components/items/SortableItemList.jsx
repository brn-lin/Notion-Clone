import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import axios from "axios";

import SortableItem from "./SortableItem";

const SortableItemList = ({
  items,
  onOpen,
  onDelete,
  onEnter,
  onBackspace,
  focusId,
  isDragging,
}) => {
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
