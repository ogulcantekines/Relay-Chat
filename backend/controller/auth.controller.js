import User from "../models/user.model.js";
import bcyrpt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import generateFriendCode from "../utils/generateFriendCode.js";
import { cookieSecure, cookieSameSite } from "../config/env.js";

export const signup = async (req, res) => {
    try {
        const { fullName, username, password, confirmPassword, gender } = req.body; // Kullanıcıdan gelen verileri al formdan girilen veriler bodyde olur

        // ═══ GİRDİ DOĞRULAMA ═══
        // Şema seviyesindeki required kuralları boş string'i yakalamıyordu,
        // bu yüzden alanlar burada açıkça kontrol ediliyor.
        if (!fullName?.trim() || !username?.trim() || !password || !gender) {
            return res.status(400).send({ message: "All fields are required" });
        }
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return res.status(400).send({
                message: "Username must be 3-20 characters and contain only letters, numbers or underscore"
            });
        }
        if (password.length < 6) {
            return res.status(400).send({ message: "Password must be at least 6 characters" });
        }
        if (!["male", "female"].includes(gender)) {
            return res.status(400).send({ message: "Gender must be either 'male' or 'female'" });
        }
        if (password !== confirmPassword) {
            return res.status(400).send({ message: "Passwords do not match" }); //şifre eşleşmiyorsa hata döner
        }

        //User modeli mongoose modelidir ve mongodb kısmında users koleksiyonuna karşılık gelir
        const user = await User.findOne({ username: username });
        if (user) {
            return res.status(400).send({ message: "User already exists" });
        }

        //hash şifreleme işlemi db ye düz metin şifre kaydetmemek için gerekir
        const salt = await bcyrpt.genSalt(10); //"10" ne kadar karmaşık olacağını belirler
        const hashedPassword = await bcyrpt.hash(password, salt);

        const boyProfilePic = `https://ui-avatars.com/api/?name=${username}&background=0D8ABC&color=fff`;
        const girlProfilePic = `https://ui-avatars.com/api/?name=${username}&background=F472B6&color=fff`;

        // Yeni kullanıcı oluştur. oluşturduğumuz User modeli mongoose modelidir ve mongodb kısmında users koleksiyonuna karşılık gelir
        const newUser = new User({
            //_id: new mongoose.Types.ObjectId(),yeni bir id oluştur bunu mongoose otomatik oluşturur
            fullName: fullName,
            username: username,
            password: hashedPassword,
            gender: gender,
            profilePic: gender === "male" ? boyProfilePic : girlProfilePic, //cinsiyete göre profil resmi belirle eğer erkekse erkek resmi, kadınsa kadın resmi
            friendCode: await generateFriendCode(),
        });

        if (newUser) {
            // Generate token and set cookie işlemi
            generateTokenAndSetCookie(newUser, res); // bu token apilere erişim için kullanılır,mesela postman veya başka istekler her yerden yapılmasın diye çerezde token saklanır

            await newUser.save(); //veritabanına kaydet

            res.status(201).send({
                message: "User created successfully",//serverın mesajı  user:bu bu diyor
                user: {
                    _id: newUser._id,
                    fullName: newUser.fullName,
                    username: newUser.username,
                    gender: newUser.gender,
                    profilePic: newUser.profilePic,
                    friendCode: newUser.friendCode
                }
            });
        } else {
            res.status(400).send({ message: "Error creating user" });
        }

    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body; //bodyden kullanıcı adı ve şifre al

        if (!username || !password) {
            return res.status(400).send({ message: "Username and password are required" });
        }

        const user = await User.findOne({ username: username }); //users collectionında kullanıcıyı bul

        if (!user) {
            return res.status(400).send({ message: "User does not exist" });
        }
        const isPasswordCorrect = await bcyrpt.compare(password, user.password); //bcrypt ile hashlenmiş şifreyi karşılaştır
        if (!isPasswordCorrect) {
            return res.status(400).send({ message: "Invalid username or password" });
        }
        // Generate token and set cookie
        generateTokenAndSetCookie(user, res); //auth işlemi başarılı ise token oluştur ve çerezde sakla. Bu token giriş yapan kullanıcıyı tanımlamak için kullanılır. onun giriş kartıdır.

        res.status(200).send({
            message: "Login successful",//server geri döndürülen mesajı
            user: {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                gender: user.gender,
                profilePic: user.profilePic,
                friendCode: user.friendCode
            }
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

export const logout = (req, res) => {
    try {
        res.clearCookie("token", {  //çerezi temizle cookieden id ve username silinir.
            httpOnly: true,
            secure: cookieSecure,
            sameSite: cookieSameSite,
            maxAge: 0
        });
        res.status(200).send({ message: "Logout successful" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

// ═══════════════════════════════════════════════════════════════
// OTURUM SAHİBİNİN BİLGİLERİ
// Route: GET /api/auth/me
// Sayfa yenilendiğinde frontend'in oturumu doğrulaması için.
// ═══════════════════════════════════════════════════════════════
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send({
            user: {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                gender: user.gender,
                profilePic: user.profilePic,
                friendCode: user.friendCode
            }
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// PROFİL GÜNCELLEME
// Route: PUT /api/auth/profile
// Görünen ad ve profil fotoğrafı güncellenir.
// Kullanıcı adı değiştirilemez: arkadaşlık ve sohbetler ona bağlı.
// ═══════════════════════════════════════════════════════════════
export const updateProfile = async (req, res) => {
    try {
        const { fullName, profilePic } = req.body;
        const updates = {};

        if (fullName !== undefined) {
            if (!fullName.trim() || fullName.trim().length > 50) {
                return res.status(400).send({ message: "Full name must be between 1 and 50 characters" });
            }
            updates.fullName = fullName.trim();
        }

        if (profilePic !== undefined) {
            // Sadece http(s) adresine izin ver: javascript: gibi şemalar XSS'e açık
            if (profilePic && !/^https?:\/\/\S+$/i.test(profilePic)) {
                return res.status(400).send({ message: "Profile picture must be a valid http(s) URL" });
            }
            updates.profilePic = profilePic;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).send({ message: "Nothing to update" });
        }

        const user = await User.findByIdAndUpdate(req.userId, updates, {
            new: true,
            runValidators: true
        }).select("-password");

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send({
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                gender: user.gender,
                profilePic: user.profilePic,
                friendCode: user.friendCode
            }
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// ŞİFRE DEĞİŞTİRME
// Route: PUT /api/auth/password
// Mevcut şifre doğrulanmadan değişiklik yapılmaz.
// ═══════════════════════════════════════════════════════════════
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).send({ message: "Current and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).send({ message: "New password must be at least 6 characters" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        const isCorrect = await bcyrpt.compare(currentPassword, user.password);
        if (!isCorrect) {
            return res.status(400).send({ message: "Current password is incorrect" });
        }

        const salt = await bcyrpt.genSalt(10);
        user.password = await bcyrpt.hash(newPassword, salt);
        await user.save();

        res.status(200).send({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};
