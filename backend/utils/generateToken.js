import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (user, res) => {
    const token = jwt.sign(
        {
            id: user._id,
            username: user.username,
        },
        process.env.JWT_SECRET,
        {expiresIn: "15d"}
    );
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "development",
        maxAge: 15 * 24 * 60 * 60 * 1000,// 15 days
        sameSite: "strict"
    });
};

export default generateTokenAndSetCookie;