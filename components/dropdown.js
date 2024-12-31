import React, { useState } from "react";

const Dropdown = ({
  children,
  isOpenbyDefault = true,
  showText = "Show Options",
  hideText = "Hide Options",
}) => {
  const [isOpen, setIsOpen] = useState(isOpenbyDefault);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="dropdown">
      {isOpen && <div className="dropdown-content">{children}</div>}
      <div
        onClick={toggleDropdown}
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            marginRight: "5px",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s",
          }}
        >
          ▼
        </span>
        <span>{isOpen ? hideText : showText}</span>
      </div>
    </div>
  );
};

export default Dropdown;
