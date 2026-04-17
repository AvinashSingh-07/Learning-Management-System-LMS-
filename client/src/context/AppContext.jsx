import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import humanizeDuration from "humanize-duration";

export const AppContext = createContext()

const normalizeApiBase = (raw) => {
    if (raw == null || typeof raw !== 'string') return ''
    const t = raw.trim()
    return t.replace(/\/$/, '')
}

export const AppContextProvider = (props) => {

    const backendUrl = normalizeApiBase(import.meta.env.VITE_BACKEND_URL)
    const currency = import.meta.env.VITE_CURRENCY ?? '$'

    const navigate = useNavigate()

    const [showLogin, setShowLogin] = useState(false)
    const [isEducator, setIsEducator] = useState(false)
    const [allCourses, setAllCourses] = useState([])
    const [userData, setUserData] = useState(null)
    const [token, setToken] = useState(localStorage.getItem("token") || null)
    const [enrolledCourses, setEnrolledCourses] = useState([])

    const getToken = async () => token;

    const fetchAllCourses = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/course/all');
            if (data.success) {
                setAllCourses(data.courses)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const fetchUserData = async () => {
        try {
            if (!token) return;
            const { data } = await axios.get(backendUrl + '/api/user/data',
                { headers: { Authorization: `Bearer ${token}` } })

            if (data.success) {
                setUserData(data.user)
                if (data.user.role === 'educator') {
                    setIsEducator(true)
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const logout = () => {
        setToken(null);
        setUserData(null);
        setIsEducator(false);
        localStorage.removeItem("token");
        navigate("/");
    }

    const fetchUserEnrolledCourses = async () => {
        if (!token) return;
        const { data } = await axios.get(backendUrl + '/api/user/enrolled-courses',
            { headers: { Authorization: `Bearer ${token}` } })

        if (data.success) {
            setEnrolledCourses(data.enrolledCourses.reverse())
        } else {
            toast.error(data.message)
        }
    }

    const calculateChapterTime = (chapter) => {
        let time = 0
        chapter.chapterContent.map((lecture) => time += lecture.lectureDuration)
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] })
    }

    const calculateCourseDuration = (course) => {
        let time = 0
        course.courseContent.map(
            (chapter) => chapter.chapterContent.map(
                (lecture) => time += lecture.lectureDuration
            )
        )
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] })
    }

    const calculateRating = (course) => {
        if (course.courseRatings.length === 0) {
            return 0
        }
        let totalRating = 0
        course.courseRatings.forEach(rating => {
            totalRating += rating.rating
        })
        return Math.floor(totalRating / course.courseRatings.length)
    }

    const calculateNoOfLectures = (course) => {
        let totalLectures = 0;
        course.courseContent.forEach(chapter => {
            if (Array.isArray(chapter.chapterContent)) {
                totalLectures += chapter.chapterContent.length;
            }
        });
        return totalLectures;
    }

    useEffect(() => {
        fetchAllCourses()
    }, [])

    useEffect(() => {
        if (token) {
            fetchUserData()
            fetchUserEnrolledCourses()
        }
    }, [token])

    const value = {
        showLogin, setShowLogin,
        backendUrl, currency, navigate,
        userData, setUserData, token, setToken, getToken, logout,
        allCourses, fetchAllCourses,
        enrolledCourses, fetchUserEnrolledCourses,
        calculateChapterTime, calculateCourseDuration,
        calculateRating, calculateNoOfLectures,
        isEducator, setIsEducator
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}
