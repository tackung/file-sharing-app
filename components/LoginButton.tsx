// components/LoginButton.tsx
import React from "react";
import { MdOutlineLogin } from "react-icons/md";

interface LoginButtonProps {
  onClick: () => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: "35px",
      }}
    >
      <span>
        <MdOutlineLogin />
      </span>

      <span style={{ marginLeft: "10px" }}>Login</span>
    </button>
  );
};

export default LoginButton;
