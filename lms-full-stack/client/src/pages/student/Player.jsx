import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import YouTube from 'react-youtube';
import { assets } from '../../assets/assets';
import { useParams, Link } from 'react-router-dom';
import humanizeDuration from 'humanize-duration';
import axios from 'axios';
import { toast } from 'react-toastify';
import Rating from '../../components/student/Rating';
import Footer from '../../components/student/Footer';
import Loading from '../../components/student/Loading';
import { extractYoutubeVideoId } from '../../utils/youtube';

const Player = ({ }) => {

  const { enrolledCourses, backendUrl, getToken, calculateChapterTime, userData, fetchUserEnrolledCourses } = useContext(AppContext)

  const { courseId } = useParams()
  const [courseData, setCourseData] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false)

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    if (!userData) return
    const found = enrolledCourses.find((c) => String(c._id) === String(courseId))
    if (found) {
      setCourseData(found)
      setAccessDenied(false)
      const rating = found.courseRatings?.find(
        (item) => String(item.userId) === String(userData._id)
      )
      if (rating) setInitialRating(rating.rating)
    } else if (enrolledCourses.length > 0) {
      setAccessDenied(true)
    }
  }, [enrolledCourses, courseId, userData])

  const markLectureAsCompleted = async (lectureId) => {

    try {

      const token = await getToken()

      const { data } = await axios.post(backendUrl + '/api/user/update-course-progress',
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        getCourseProgress()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }

  }

  const getCourseProgress = async () => {

    try {

      const token = await getToken()

      const { data } = await axios.post(backendUrl + '/api/user/get-course-progress',
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setProgressData(data.progressData)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }

  }

  const handleRate = async (rating) => {

    try {

      const token = await getToken()

      const { data } = await axios.post(backendUrl + '/api/user/add-rating',
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        fetchUserEnrolledCourses()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (courseId) getCourseProgress()
  }, [courseId])

  const youtubeId = playerData ? extractYoutubeVideoId(playerData.lectureUrl) : null

  if (!userData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 mb-4">Log in to watch your courses.</p>
        <Link to="/" className="text-blue-600 underline">Home</Link>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 mb-4">You are not enrolled in this course.</p>
        <Link to="/my-enrollments" className="text-blue-600 underline">My enrollments</Link>
      </div>
    )
  }

  return courseData ? (
    <>

      {courseData.courseContent.length === 0 ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No content yet</h2>
          <p className="text-gray-500 mb-6">
            The educator hasn't uploaded any lectures for <strong>{courseData.courseTitle}</strong> yet. Check back soon!
          </p>
          <Link to="/my-enrollments" className="text-blue-600 underline text-sm">← Back to My Enrollments</Link>
        </div>
      ) : (
        <>
          <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36'>
            <div className="text-gray-800">
              <h2 className="text-xl font-semibold">Course Structure</h2>
              <div className="pt-5">
                {courseData && courseData.courseContent.map((chapter, index) => (
                  <div key={index} className="border border-gray-300 bg-white mb-2 rounded">
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                      onClick={() => toggleSection(index)}
                    >
                      <div className="flex items-center gap-2">
                        <img src={assets.down_arrow_icon} alt="arrow icon" className={`transform transition-transform ${openSections[index] ? "rotate-180" : ""}`} />
                        <p className="font-medium md:text-base text-sm">{chapter.chapterTitle}</p>
                      </div>
                      <p className="text-sm md:text-default">{chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}</p>
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? "max-h-96" : "max-h-0"}`}>
                      <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                        {chapter.chapterContent.map((lecture, i) => (
                          <li key={i} className="flex items-start gap-2 py-1">
                            <img src={progressData && progressData.lectureCompleted.includes(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon} alt="bullet icon" className="w-4 h-4 mt-1" />
                            <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                              <p>{lecture.lectureTitle}</p>
                              <div className='flex gap-2'>
                                {lecture.lectureUrl && <p onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })} className='text-blue-500 cursor-pointer'>Watch</p>}
                                <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['h', 'm'] })}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 py-3 mt-10">
                <h1 className="text-xl font-bold">Rate this Course:</h1>
                <Rating initialRating={initialRating} onRate={handleRate} />
              </div>
            </div>

            <div className='md:mt-10'>
              {playerData ? (
                <div>
                  {youtubeId ? (
                    <YouTube
                      videoId={youtubeId}
                      iframeClassName="w-full aspect-video"
                      opts={{ playerVars: { rel: 0 } }}
                    />
                  ) : (
                    <div className="aspect-video w-full flex items-center justify-center bg-gray-100 text-gray-600 text-sm px-4 text-center rounded">
                      Invalid or missing video URL for this lecture. Use a full YouTube link (e.g. https://www.youtube.com/watch?v=VIDEO_ID).
                    </div>
                  )}
                  <div className='flex justify-between items-center mt-1'>
                    <p className='text-xl'>{playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}</p>
                    <button onClick={() => markLectureAsCompleted(playerData.lectureId)} className='text-blue-600'>
                      {progressData && progressData.lectureCompleted.includes(playerData.lectureId) ? 'Completed' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              ) : (
                <img src={courseData ? courseData.courseThumbnail : ''} alt="" />
              )}
            </div>
          </div>
          <Footer />
        </>
      )}
    </>
  ) : <Loading />
}

export default Player