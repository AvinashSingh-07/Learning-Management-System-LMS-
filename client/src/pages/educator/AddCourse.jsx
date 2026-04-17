import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify'
import Quill from 'quill';

import axios from 'axios'
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/student/Loading';

const AddCourse = () => {

  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(courseId);

  const { backendUrl, getToken, isEducator } = useContext(AppContext)

  const [loadedCourse, setLoadedCourse] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const [courseTitle, setCourseTitle] = useState('')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [image, setImage] = useState('')
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);

  const [showChapterInput, setShowChapterInput] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: '',
    lectureDuration: '',
    lectureUrl: '',
    isPreviewFree: false,
  });

  const addChapter = () => {
    const title = newChapterTitle.trim();
    if (!title) return;
    const newChapter = {
      chapterId: crypto.randomUUID(),
      chapterTitle: title,
      chapterContent: [],
      collapsed: false,
      chapterOrder: chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
    };
    setChapters([...chapters, newChapter]);
    setNewChapterTitle('');
    setShowChapterInput(false);
  };

  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      setShowChapterInput(true);
    } else if (action === 'remove') {
      setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
    } else if (action === 'toggle') {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId ? { ...chapter, collapsed: !chapter.collapsed } : chapter
        )
      );
    }
  };

  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === 'remove') {

      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            return {
              ...chapter,
              chapterContent: chapter.chapterContent.filter((_, i) => i !== lectureIndex),
            };
          }
          return chapter;
        })
      );
    }
  };

  const addLecture = () => {

    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder: chapter.chapterContent.length > 0 ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1 : 1,
            lectureId: crypto.randomUUID()
          };
          return { ...chapter, chapterContent: [...chapter.chapterContent, newLecture] };
        }
        return chapter;
      })
    );
    setShowPopup(false);
    setLectureDetails({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false,
    });
  };

  const handleSubmit = async (e) => {
    try {

      e.preventDefault();

      if (!image) {
        toast.error('Thumbnail URL Not Provided')
        return;
      }

      const descriptionHtml =
        quillRef.current?.root?.innerHTML ??
        (isEditMode && loadedCourse ? loadedCourse.courseDescription : '') ??
        ''

      const courseData = {
        courseTitle,
        courseDescription: descriptionHtml,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
        courseThumbnail: image,
      }

      const token = await getToken()

      if (isEditMode) {
        const { data } = await axios.put(
          `${backendUrl}/api/educator/course/${courseId}`,
          { courseData: JSON.stringify(courseData) },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (data.success) {
          toast.success(data.message)
          navigate('/educator/my-courses')
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(backendUrl + '/api/educator/add-course', { courseData: JSON.stringify(courseData) },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (data.success) {
          toast.success(data.message)
          setCourseTitle('')
          setCoursePrice(0)
          setDiscount(0)
          setImage('')
          setChapters([])
          if (quillRef.current?.root) {
            quillRef.current.root.innerHTML = ''
          }
        } else {
          toast.error(data.message)
        }
      }

    } catch (error) {
      toast.error(error.message)
    }

  };

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return
    quillRef.current = new Quill(editorRef.current, {
      theme: 'snow',
    })
  }, [loadedCourse, loadError, isEditMode])

  useEffect(() => {
    if (!isEditMode || !isEducator) return;

    const loadCourse = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(`${backendUrl}/api/educator/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success && data.course) {
          const c = data.course;
          setCourseTitle(c.courseTitle || '');
          setCoursePrice(c.coursePrice ?? 0);
          setDiscount(c.discount ?? 0);
          setImage(c.courseThumbnail || '');
          setChapters(
            (c.courseContent || []).map((ch) => ({
              ...ch,
              collapsed: ch.collapsed ?? false,
            }))
          );
          setLoadedCourse(c);
        } else {
          setLoadError(true);
          toast.error(data.message || 'Could not load course');
        }
      } catch (e) {
        setLoadError(true);
        toast.error(e.message);
      }
    };

    loadCourse();
  }, [isEditMode, isEducator, courseId, backendUrl]);

  useEffect(() => {
    if (!loadedCourse || !quillRef.current?.root) return
    quillRef.current.root.innerHTML = loadedCourse.courseDescription || ''
  }, [loadedCourse]);

  if (isEditMode && !loadedCourse && !loadError) {
    return <Loading />;
  }

  if (isEditMode && loadError) {
    return (
      <div className="p-8">
        <p className="text-gray-600 mb-4">Could not load this course for editing.</p>
        <button type="button" className="text-blue-600 underline" onClick={() => navigate('/educator/my-courses')}>
          Back to My Courses
        </button>
      </div>
    );
  }

  return (
    <div className='h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      {isEditMode && <h2 className="text-lg font-semibold text-gray-800 mb-2">Edit course</h2>}
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 max-w-md w-full text-gray-500'>
        <div className='flex flex-col gap-1'>
          <p>Course Title</p>
          <input onChange={e => setCourseTitle(e.target.value)} value={courseTitle} type="text" placeholder='Type here' className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500' required />
        </div>

        <div className='flex flex-col gap-1'>
          <p>Course Description</p>
          <div ref={editorRef}></div>
        </div>

        <div className='flex items-center justify-between flex-wrap'>
          <div className='flex flex-col gap-1'>
            <p>Course Price</p>

            <input
              onChange={e => setCoursePrice(e.target.value)}
              onFocus={e => e.target.select()}
              value={coursePrice}
              type="number"
              placeholder='0'
              className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500'
              required
            />
          </ div>

          <div className='flex md:flex-row flex-col items-center gap-3'>
            <p>Course Thumbnail URL</p>
            <input type="text" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." className='outline-none py-2 px-3 border border-gray-500 rounded w-full' required />
            {image && <img className='max-h-10 ml-2 rounded' src={image} alt="Preview" />}
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <p>Discount %</p>

          <input
            onChange={e => setDiscount(e.target.value)}
            onFocus={e => e.target.select()}
            value={discount}
            type="number"
            placeholder='0'
            min={0}
            max={100}
            className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500'
            required
          />
        </div>

        <div>
          {chapters.map((chapter, chapterIndex) => (
            <div key={chapterIndex} className="bg-white border rounded-lg mb-4">
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center">
                  <img className={`mr-2 cursor-pointer transition-all ${chapter.collapsed && "-rotate-90"} `} onClick={() => handleChapter('toggle', chapter.chapterId)} src={assets.dropdown_icon} width={14} alt="" />
                  <span className="font-semibold">{chapterIndex + 1} {chapter.chapterTitle}</span>
                </div>
                <span className="text-gray-500">{chapter.chapterContent.length} Lectures</span>
                <img onClick={() => handleChapter('remove', chapter.chapterId)} src={assets.cross_icon} alt="" className='cursor-pointer' />
              </div>
              {!chapter.collapsed && (
                <div className="p-4">
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div key={lectureIndex} className="flex justify-between items-center mb-2">
                      <span>{lectureIndex + 1} {lecture.lectureTitle} - {lecture.lectureDuration} mins - <a href={lecture.lectureUrl} target="_blank" className="text-blue-500">Link</a> - {lecture.isPreviewFree ? 'Free Preview' : 'Paid'}</span>
                      <img onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)} src={assets.cross_icon} alt="" className='cursor-pointer' />
                    </div>
                  ))}
                  <div className="inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2" onClick={() => handleLecture('add', chapter.chapterId)}>
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}

          {showChapterInput ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChapter()}
                placeholder="Chapter name..."
                className="flex-1 border border-gray-400 rounded px-3 py-2 outline-none text-sm"
                autoFocus
              />
              <button
                type="button"
                onClick={addChapter}
                className="bg-blue-500 text-white px-3 py-2 rounded text-sm"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setShowChapterInput(false); setNewChapterTitle(''); }}
                className="text-gray-500 text-sm px-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div
              className="flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer"
              onClick={() => handleChapter('add')}
            >
              + Add Chapter
            </div>
          )}

          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
              <div className="bg-white text-gray-700 p-4 rounded relative w-full max-w-80">
                <h2 className="text-lg font-semibold mb-4">Add Lecture</h2>
                <div className="mb-2">
                  <p>Lecture Title</p>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureTitle}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <p>Duration (minutes)</p>
                  <input
                    type="number"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureDuration}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <p>Lecture URL</p>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureUrl}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 my-4">
                  <p>Is Preview Free?</p>
                  <input
                    type="checkbox" className='mt-1 scale-125'
                    checked={lectureDetails.isPreviewFree}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })}
                  />
                </div>
                <button type='button' className="w-full bg-blue-400 text-white px-4 py-2 rounded" onClick={addLecture}>Add</button>
                <img onClick={() => setShowPopup(false)} src={assets.cross_icon} className='absolute top-4 right-4 w-4 cursor-pointer' alt="" />
              </div>
            </div>
          )}
        </div>

        <button type="submit" className='bg-black text-white w-max py-2.5 px-8 rounded my-4'>
          {isEditMode ? 'UPDATE' : 'ADD'}
        </button>
      </form>
    </div>
  );
};

export default AddCourse;