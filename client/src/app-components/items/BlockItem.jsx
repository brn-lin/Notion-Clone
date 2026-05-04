import { useState, useEffect, useRef } from "react";
import "./BlockItem.css";

const BlockItem = ({ item, onChange, onEnter, onBackspace, focusId }) => {
  const [text, setText] = useState(item.content?.text || "");

  const inputRef = useRef(null);

  useEffect(() => {
    setText(item.content?.text || "");
  }, [item.content?.text]);

  // Focus when instructed by handleEnter function in CenterEditor.jsx
  useEffect(() => {
    if (focusId === item.id) {
      inputRef.current?.focus();
    }
  }, [focusId, item.id]);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    onChange(item.id, value);
  };

  const handleKeyDown = (e) => {
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
