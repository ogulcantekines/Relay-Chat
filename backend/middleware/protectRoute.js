import { verifySession } from "../utils/session.js";

const protectRoute = async (req, res, next) => {
    try {
        // Validate both the signature and its persisted session record.
        const decoded = await verifySession(req.cookies.token || "");
        req.userId = decoded.id;
        req.sessionId = decoded.jti;
        next();
    } catch {
        res.status(401).json({ message: "Unauthorized: Invalid session" });
    }
};
export default protectRoute;
