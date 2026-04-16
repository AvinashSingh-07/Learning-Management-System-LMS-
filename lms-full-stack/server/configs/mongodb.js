import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () =>
            console.log("Database Connected")
        );

        const uri = process.env.MONGODB_URI?.trim();
        if (!uri) {
            console.error("MONGODB_URI is not set in environment");
            process.exit(1);
        }

        await mongoose.connect(uri);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};

export default connectDB;
