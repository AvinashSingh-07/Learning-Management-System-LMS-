import jwt from 'jsonwebtoken';
import Course from '../models/Course.js';
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';

export const updateRoleToEducator = async (req, res) => {

    try {

        const userId = req.auth.userId

        await User.findByIdAndUpdate(userId, { role: 'educator' })

        const token = jwt.sign(
            { id: userId, role: 'educator' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        )

        res.json({ success: true, message: 'You can publish a course now', token })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

export const addCourse = async (req, res) => {

    try {

        const { courseData } = req.body
        const educatorId = req.auth.userId

        const parsedCourseData = await JSON.parse(courseData)
        if (!parsedCourseData.courseThumbnail) {
            return res.json({ success: false, message: 'Thumbnail URL Not Attached' })
       }

        parsedCourseData.educator = educatorId

        const newCourse = await Course.create(parsedCourseData)

        await newCourse.save()

        res.json({ success: true, message: 'Course Added' })

    } catch (error) {

        res.json({ success: false, message: error.message })

    }
}

export const getEducatorCourses = async (req, res) => {
    try {

        const educator = req.auth.userId

        const courses = await Course.find({ educator })

        res.json({ success: true, courses })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getEducatorCourseById = async (req, res) => {
    try {
        const { courseId } = req.params
        const educator = req.auth.userId

        const course = await Course.findById(courseId)
        if (!course) {
            return res.json({ success: false, message: 'Course not found' })
        }
        if (String(course.educator) !== String(educator)) {
            return res.json({ success: false, message: 'Access denied' })
        }

        res.json({ success: true, course })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const updateCourse = async (req, res) => {
    try {
        const { courseId } = req.params
        const educatorId = req.auth.userId
        const { courseData } = req.body

        const existing = await Course.findById(courseId)
        if (!existing) {
            return res.json({ success: false, message: 'Course not found' })
        }
        if (String(existing.educator) !== String(educatorId)) {
            return res.json({ success: false, message: 'Access denied' })
        }

        const parsed = JSON.parse(courseData)
        if (!parsed.courseThumbnail) {
            return res.json({ success: false, message: 'Thumbnail URL Not Attached' })
        }

        await Course.findByIdAndUpdate(courseId, {
            courseTitle: parsed.courseTitle,
            courseDescription: parsed.courseDescription,
            courseThumbnail: parsed.courseThumbnail,
            coursePrice: Number(parsed.coursePrice),
            discount: Number(parsed.discount),
            courseContent: parsed.courseContent,
            isPublished: parsed.isPublished !== undefined ? parsed.isPublished : existing.isPublished,
        })

        res.json({ success: true, message: 'Course updated' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const educatorDashboardData = async (req, res) => {
    try {
        const educator = req.auth.userId;

        const courses = await Course.find({ educator });

        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        });

        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        const enrolledStudentsData = [];
        for (const course of courses) {
            const students = await User.find({
                _id: { $in: course.enrolledStudents }
            }, 'name');

            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                    student
                });
            });
        }

        res.json({
            success: true,
            dashboardData: {
                totalEarnings,
                enrolledStudentsData,
                totalCourses
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = req.auth.userId;

        const courses = await Course.find({ educator });

        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        }).populate('userId', 'name').populate('courseId', 'courseTitle');

        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({
            success: true,
            enrolledStudents
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};
