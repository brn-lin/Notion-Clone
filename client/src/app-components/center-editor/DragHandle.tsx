import { RxDragHandleDots2 } from "react-icons/rx";
import { useSortable } from "@dnd-kit/sortable";
import "./DragHandle.css";

type DragHandleProps = {
  listeners?: ReturnType<typeof useSortable>["listeners"];
};

const DragHandle = ({ listeners }: DragHandleProps) => {
  return (
    <div
      className="drag-handle-button"
      {...listeners}
      onClick={(e) => e.stopPropagation()}
    >
      <RxDragHandleDots2 />
    </div>
  );
};

export default DragHandle;
