import { RxDragHandleDots2 } from "react-icons/rx";
import "./DragHandle.css";

const DragHandle = ({ listeners }) => {
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
