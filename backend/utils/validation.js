export const validId = (value) => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
export const validPassword = (value) => typeof value === "string" && value.length >= 8 && Buffer.byteLength(value, "utf8") <= 72;
export const publicUserFields = "fullName username profilePic friendCode";

export function validateIds(req, res, next) {
    const ids = Object.entries(req.params).filter(([key]) => /id$/i.test(key));
    if (ids.some(([, value]) => !validId(value))) return res.status(400).json({ message: "Invalid id", error: "Invalid id" });
    next();
}
