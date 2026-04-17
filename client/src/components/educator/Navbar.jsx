import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';

const Navbar = ({ bgColor }) => {

  const { isEducator, userData, logout } = useContext(AppContext)

  return isEducator && userData && (
    <div className={`flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3 ${bgColor}`}>
      <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="Learn grid home">
        <img src={assets.logo} alt="" className="h-9 w-9 md:h-10 md:w-10 shrink-0" />
        <span className="font-semibold text-gray-800 text-lg md:text-xl tracking-tight hidden sm:inline">Learn grid</span>
      </Link>
      <div className="flex items-center gap-5 text-gray-500 relative">
        <p>Hi! {userData.name || userData.fullName}</p>
        <div className="flex items-center gap-3">
          <img src={assets.user_icon} alt="" className="w-10 h-10 rounded-full object-contain p-1 bg-gray-100 border" />
          <button onClick={logout} className="text-sm hover:underline text-red-500 font-medium">Log Out</button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;