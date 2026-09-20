import mongoose from "mongoose";

// Persist sessions so logout and password changes can revoke signed tokens.
const sessionSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 }
});
export default mongoose.model("Session", sessionSchema);
