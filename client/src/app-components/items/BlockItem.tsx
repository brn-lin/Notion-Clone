import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import type { BlockItemType } from "../../types/item";
import "./BlockItem.css";

type BlockItemProps = {
  item: BlockItemType;
  onChange: (id: string, text: string) => void;
  onEnter: (item: BlockItemType) => void;
  onBackspace: (item: BlockItemType) => void;
  focusId: string | null;
};

const BlockItem = ({
  item,
  onChange,
  onEnter,
  onBackspace,
  focusId,
}: BlockItemProps) => {
  const [text, setText] = useState(item.content.text || "");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(item.content.text || "");
  }, [item.content.text]);

  // Focus when instructed by handleEnter function in CenterEditor.jsx
  useEffect(() => {
    if (focusId === item.id) {
      inputRef.current?.focus();
    }
  }, [focusId, item.id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);

    onChange(item.id, value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter(item);
    }

    if (e.key === "Backspace") {
      // Only delete block if empty
      if (text.length === 0) {
        e.preventDefault();
        onBackspace(item);
      }
    }
  };

  return (
    <input
      className="block__content"
      data-id={item.id}
      ref={inputRef}
      value={text}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
};

export default BlockItem;
