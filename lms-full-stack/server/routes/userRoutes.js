import express from 'express'
import { addUserRating, enrollFreeCourse, getUserCourseProgress, getUserData, purchaseCourse, updateUserCourseProgress, userEnrolledCourses } from '../controllers/userController.js';
import { authUser } from '../middlewares/authMiddleware.js';

const userRouter = express.Router()

userRouter.get('/data', authUser, getUserData)
userRouter.post('/purchase', authUser, purchaseCourse)
userRouter.post('/enroll-free', authUser, enrollFreeCourse)
userRouter.get('/enrolled-courses', authUser, userEnrolledCourses)
userRouter.post('/update-course-progress', authUser, updateUserCourseProgress)
userRouter.post('/get-course-progress', authUser, getUserCourseProgress)
userRouter.post('/add-rating', authUser, addUserRating)

export default userRouter;