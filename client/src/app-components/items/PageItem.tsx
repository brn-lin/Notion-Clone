import { RiDeleteBinLine } from "react-icons/ri";
import type { Item } from "../../types/item";
import "./PageItem.css";

type PageItemProps = {
  item: Item;
  onDelete: (id: string) => void;
};

const PageItem = ({ item, onDelete }: PageItemProps) => {
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
