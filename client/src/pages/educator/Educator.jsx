import React, { useContext, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import SideBar from '../../components/educator/SideBar'
import Navbar from '../../components/educator/Navbar'
import Footer from '../../components/educator/Footer'
import { AppContext } from '../../context/AppContext'

const Educator = () => {

    const { token, isEducator } = useContext(AppContext)
    const navigate = useNavigate()

    useEffect(() => {
        if (!token) {
            navigate('/')
        }
    }, [token, navigate])

    return (
        <div className="text-default min-h-screen bg-white">
            <Navbar />
            <div className='flex'>
                <SideBar />
                <div className='flex-1'>
                    {<Outlet />}
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Educator