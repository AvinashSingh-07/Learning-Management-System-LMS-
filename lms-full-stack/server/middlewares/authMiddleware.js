import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.')
    process.exit(1)
}

export const authUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.json({ success: false, message: 'Unauthorized Access' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.auth = { userId: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export const protectEducator = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.json({ success: false, message: 'Unauthorized Access' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'educator') {
            return res.json({ success: false, message: 'Unauthorized Access' });
        }

        req.auth = { userId: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}