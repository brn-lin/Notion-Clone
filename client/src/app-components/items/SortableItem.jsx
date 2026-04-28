import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import PageItem from "./PageItem";
import BlockItem from "./BlockItem";
import DragHandle from "../center-editor/DragHandle";

import "./SortableItem.css";

const SortableItem = ({
  item,
  onOpen,
  onDelete,
  onEnter,
  onBackspace,
  focusId,
  isDragging,
}) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: item.id,
  });

  const style = { transform: CSS.Transform.toString(transform) };

  const renderItem = () => {
    if (item.type === "page") {
      return <PageItem item={item} />;
    }

    if (item.type === "block") {
      return <BlockItem item={item} />;
    }

    return null;
  };

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
          onEnter={onEnter}
          onBackspace={onBackspace}
          focusId={focusId}
        />
      </div>
    </div>
  );
};

export default SortableItem;
