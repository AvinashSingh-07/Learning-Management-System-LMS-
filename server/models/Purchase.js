import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentMode: { type: String, enum: ['stripe', 'free'], default: 'free' },
    enrollmentDetails: {
        fullName: { type: String },
        phone: { type: String },
        addressLine1: { type: String },
        city: { type: String },
        country: { type: String },
    },
}, { timestamps: true });

export const Purchase = mongoose.model('Purchase', PurchaseSchema);