import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Navbar = () => {

  const location = useLocation();

  const isCoursesListPage = location.pathname.includes('/course-list');

  const { backendUrl, isEducator, setIsEducator, navigate, getToken, setToken, userData, setUserData, setShowLogin, logout } = useContext(AppContext)

  const becomeEducator = async () => {

    try {

      if (isEducator) {
        navigate('/educator')
        return;
      }

      const token = await getToken()
      const { data } = await axios.get(backendUrl + '/api/educator/update-role', { headers: { Authorization: `Bearer ${token}` } })
      if (data.success) {
        toast.success(data.message)
        setIsEducator(true)
        if (data.token) {
          setToken(data.token)
          localStorage.setItem('token', data.token)
        }
        if (userData) {
          setUserData({ ...userData, role: 'educator' })
        }
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${isCoursesListPage ? 'bg-white' : 'bg-cyan-100/70'}`}>
      <div
        onClick={() => navigate('/')}
        className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
        role="link"
        aria-label="Learn grid home"
      >
        <img src={assets.logo} alt="" className="h-9 w-9 md:h-10 md:w-10 shrink-0" />
        <span className="font-semibold text-gray-800 text-lg md:text-xl tracking-tight hidden sm:inline">Learn grid</span>
      </div>
      <div className="md:flex hidden items-center gap-5 text-gray-500">
        <div className="flex items-center gap-5">
          {
            userData && <>
              <button onClick={becomeEducator}>{isEducator ? 'Educator Dashboard' : 'Become Educator'}</button>
              | <Link to='/my-enrollments' >My Enrollments</Link>
            </>
          }
        </div>
        {userData
          ? <div className="flex items-center gap-3">
              <img src={assets.user_icon} alt="" className="w-10 h-10 rounded-full object-contain p-1 bg-gray-100" />
              <button onClick={logout} className="text-sm font-medium hover:underline text-red-500">Log Out</button>
            </div>
          : <button onClick={() => setShowLogin(true)} className="bg-blue-600 text-white px-5 py-2 rounded-full">
            Create Account
          </button>}
      </div>

      <div className='md:hidden flex items-center gap-2 sm:gap-5 text-gray-500'>
        <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
          <button onClick={becomeEducator}>{isEducator ? 'Educator Dashboard' : 'Become Educator'}</button>
          | {
            userData && <Link to='/my-enrollments' >My Enrollments</Link>
          }
        </div>
        {userData
          ? <div className="flex items-center gap-2 relative group">
              <img src={assets.user_icon} alt="" className="w-8 h-8 rounded-full object-contain p-0.5 bg-gray-100" />
              <button onClick={logout} className="text-xs hover:underline text-red-500">Logout</button>
            </div>
          : <button onClick={() => setShowLogin(true)}>
            <img src={assets.user_icon} alt="" />
          </button>}
      </div>
    </div>
  );
};

export default Navbar;