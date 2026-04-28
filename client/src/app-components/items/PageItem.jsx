import { RiDeleteBinLine } from "react-icons/ri";
import "./PageItem.css";

const PageItem = ({ item, onDelete }) => {
  return (
    <div className="page-item">
      <div className="page__title">{item.title}</div>

      <button
        className="page__delete-button"
        onClick={(e) => {
          e.stopPropagation(); // Prevents opening a page
          onDelete(item.id);
        }}
      >
        <RiDeleteBinLine />
      </button>
    </div>
  );
};

export default PageItem;
