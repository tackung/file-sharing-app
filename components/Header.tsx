import React from "react";
import styled from "styled-components";
import { FaHandsHoldingCircle } from "react-icons/fa6";
import { MdOutlineLogout } from "react-icons/md";

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderLogo = styled.div`
  display: flex;
  align-items: center;
  margin-left: 10px;
  margin-top: 10px;
  span {
    font-size: 22px;
    margin-left: 10px;
    color: black;
  }
`;

interface HeaderProps {
  user: any;
  logout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, logout }) => {
  return (
    <HeaderContainer className="flex justify-between items-center bg-gray-900 text-white">
      <HeaderLogo className="ml-4 mb-2 flex items-center">
        <FaHandsHoldingCircle size={40} className="mr-4 ml-2" />
        HAL-SHARE
      </HeaderLogo>
      {user && (
        <button
          onClick={logout}
          className="flex items-center bg-gray-500 hover:bg-red-700 text-white py-2 px-4 rounded mr-4"
        >
          <MdOutlineLogout className="mr-1" />
          Logout
        </button>
      )}
    </HeaderContainer>
  );
};

export default Header;
