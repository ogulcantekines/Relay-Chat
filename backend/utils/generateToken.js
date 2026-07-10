import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (user, res) => {
    // Kullanıcı bilgilerini içeren bir JWT token oluştur id ve username.
    const token = jwt.sign(
        {
            id: user._id,
            username: user.username,
        },
        process.env.JWT_SECRET, //.env dosyasındaki gizli anahtar
        {expiresIn: "15d"}
    );
    // Token'ı çerezde sakla(HTTP only cookie olarak)
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 24 * 60 * 60 * 1000,// 15 days
        sameSite: "strict"
    });
};

export default generateTokenAndSetCookie; 

/*const payload = { id: user._id, username: user.username };
const token = jwt.sign(payload, secret, { expiresIn: "15d" });

// payload değişkenine bakabilirsin
console.log(payload.id, payload.username);

nesne isiml muhabbeti için gerekli
*/





