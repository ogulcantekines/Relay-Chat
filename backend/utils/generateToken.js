import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import Session from "../models/session.model.js";
import { cookieSecure, cookieSameSite } from "../config/env.js";

const generateTokenAndSetCookie = async (user, res) => {
    const sessionId = randomUUID();
    // Kullanıcı bilgilerini içeren bir JWT token oluştur id ve username.
    const token = jwt.sign(
        {
            id: user._id,
            username: user.username,
            jti: sessionId,
        },
        process.env.JWT_SECRET, //.env dosyasındaki gizli anahtar
        {expiresIn: "15d"}
    );
    // Token'ı çerezde sakla(HTTP only cookie olarak)
    await Session.create({ _id: sessionId, userId: user._id, expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) });
    res.cookie("token", token, {
        httpOnly: true,
        secure: cookieSecure,
        maxAge: 15 * 24 * 60 * 60 * 1000,// 15 days
        sameSite: cookieSameSite
    });
};

export default generateTokenAndSetCookie; 

/*const payload = { id: user._id, username: user.username };
const token = jwt.sign(payload, secret, { expiresIn: "15d" });

// payload değişkenine bakabilirsin
console.log(payload.id, payload.username);

nesne isiml muhabbeti için gerekli
*/





