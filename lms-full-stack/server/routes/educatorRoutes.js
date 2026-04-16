import express from 'express'
import { addCourse, educatorDashboardData, getEducatorCourseById, getEducatorCourses, getEnrolledStudentsData, updateCourse, updateRoleToEducator } from '../controllers/educatorController.js';
import { authUser, protectEducator } from '../middlewares/authMiddleware.js';

const educatorRouter = express.Router()

educatorRouter.get('/update-role', authUser, updateRoleToEducator)

educatorRouter.post('/add-course', protectEducator, addCourse)

educatorRouter.get('/courses', protectEducator, getEducatorCourses)

educatorRouter.get('/course/:courseId', protectEducator, getEducatorCourseById)

educatorRouter.put('/course/:courseId', protectEducator, updateCourse)

educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)

educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)

export default educatorRouter;