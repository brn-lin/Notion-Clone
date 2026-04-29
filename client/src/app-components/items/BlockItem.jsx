import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./BlockItem.css";
import api from "../../api/axios";

const BlockItem = ({ item, onEnter, onBackspace, focusId }) => {
  const [text, setText] = useState(item.content?.text || "");
  const token = localStorage.getItem("token");

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
    setText(e.target.value);
  };

  // Saves block's text to DB whenever user clicks away from input field
  const handleBlur = async () => {
    try {
      const workspaceId = item.workspace_id;

      await api.patch(`/workspaces/${workspaceId}/items/${item.id}`, {
        content: {
          text: text,
        },
      });
    } catch (err) {
      console.error("Failed to update block:", err);
    }
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
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};

export default BlockItem;
