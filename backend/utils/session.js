import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";

export async function verifySession(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!mongoose.isObjectIdOrHexString(decoded.id) || typeof decoded.jti !== "string") throw new Error("Invalid session");
    const session = await Session.exists({ _id: decoded.jti, userId: decoded.id, expiresAt: { $gt: new Date() } });
    if (!session || !await User.exists({ _id: decoded.id })) throw new Error("Invalid session");
    return decoded;
}
