import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import PageItem from "./PageItem";
import BlockItem from "./BlockItem";
import DragHandle from "../center-editor/DragHandle";

import type { Item } from "../../types/item";

import "./SortableItem.css";

type SortableItemProps = {
  item: Item;
  onOpen: () => void;
  onDelete: (id: string) => void;
  onChange: (id: string, text: string) => void;
  onEnter: (item: Item) => void;
  onBackspace: (item: Item) => void;
  focusId: string | null;
  isDragging: boolean;
};

const SortableItem = ({
  item,
  onOpen,
  onDelete,
  onChange,
  onEnter,
  onBackspace,
  focusId,
  isDragging,
}: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: item.id,
  });

  const style = { transform: CSS.Transform.toString(transform) };

  // If page, keep old drag behavior along with drag button
  if (item.type === "page") {
    return (
      <div
        ref={setNodeRef}
        className={`sortable-item ${item.type} ${isDragging ? "dragging" : ""}`}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onOpen}
      >
        <div className="drag-zone">
          <DragHandle />
        </div>

        <div className="content-zone">
          <PageItem item={item} onDelete={onDelete} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`sortable-item ${item.type} ${isDragging ? "dragging" : ""}`}
      style={style}
      {...attributes}
    >
      <div className="drag-zone">
        <DragHandle listeners={listeners} />
      </div>

      <div className="content-zone">
        <BlockItem
          item={item}
          onChange={onChange}
          onEnter={onEnter}
          onBackspace={onBackspace}
          focusId={focusId}
        />
      </div>
    </div>
  );
};

export default SortableItem;
