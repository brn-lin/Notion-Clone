import { RxDragHandleDots2 } from "react-icons/rx";
import "./DragHandle.css";

type DragHandleProps = {
  listeners?: Record<string, (...args: any[]) => void>;
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
