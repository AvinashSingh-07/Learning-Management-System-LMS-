import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 16;

const isValidEmail    = (e) => EMAIL_REGEX.test(String(e).trim());
const isValidPassword = (p) => p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX;

export const register = async (req, res) => {
    try {
        const body     = req.body && typeof req.body === "object" ? req.body : {};
        const name     = String(body.name     ?? "").trim();
        const email    = String(body.email    ?? "").trim().toLowerCase();
        const password = String(body.password ?? "");

        if (!name || !email || !password) {
            return res.json({ success: false, message: "Please enter name, email, and password." });
        }

        if (!isValidEmail(email)) {
            return res.json({ success: false, message: "Enter a valid email address (e.g. you@example.com)." });
        }

        if (!isValidPassword(password)) {
            return res.json({
                success: false,
                message: `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters.`,
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "An account with this email already exists." });
        }

        const salt         = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: body.role || "student",
        });

        const user  = await newUser.save();
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ success: true, token, user });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const email    = String(req.body?.email    ?? "").trim().toLowerCase();
        const password = String(req.body?.password ?? "");

        if (!email || !password) {
            return res.json({ success: false, message: "Please enter your email and password." });
        }

        if (!isValidEmail(email)) {
            return res.json({ success: false, message: "Enter a valid email address." });
        }

        if (!isValidPassword(password)) {
            return res.json({
                success: false,
                message: `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters.`,
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "No account found with this email." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Incorrect password. Please try again." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ success: true, token, user });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
