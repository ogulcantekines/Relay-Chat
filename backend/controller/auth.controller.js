import User from "../models/user.model.js";
import bcyrpt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/generateToken.js";

export const signup = async (req, res) => {
    try {
        const {fullName, username, password, confirmPassword, gender} = req.body; // Kullanıcıdan gelen verileri al formdan girilen veriler bodyde olur
        if(password !== confirmPassword) {
            return res.status(400).send({message: "Passwords do not match"}); //şifre eşleşmiyorsa hata döner
        }
        
        //User modeli mongoose modelidir ve mongodb kısmında users koleksiyonuna karşılık gelir
        const user = await User.findOne({username: username});
        if(user){
            return res.status(400).send({message: "User already exists"});
        }

        //hash şifreleme işlemi db ye düz metin şifre kaydetmemek için gerekir
        const salt = await bcyrpt.genSalt(10); //"10" ne kadar karmaşık olacağını belirler
        const hashedPassword = await bcyrpt.hash(password, salt);

        const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

        // Yeni kullanıcı oluştur. oluşturduğumuz User modeli mongoose modelidir ve mongodb kısmında users koleksiyonuna karşılık gelir
        const newUser = new User({
            //_id: new mongoose.Types.ObjectId(),yeni bir id oluştur bunu mongoose otomatik oluşturur
            fullName: fullName,
            username: username,
            password: hashedPassword,
            gender: gender,
            profilePic: gender === "male" ? boyProfilePic : girlProfilePic //cinsiyete göre profil resmi belirle eğer erkekse erkek resmi, kadınsa kadın resmi
        });

        if (newUser) {
            // Generate token and set cookie işlemi
            generateTokenAndSetCookie(newUser, res); // bu token apilere erişim için kullanılır,mesela postman veya başka istekler her yerden yapılmasın diye çerezde token saklanır

            await newUser.save(); //veritabanına kaydet

            res.status(201).send({message: "User created successfully",//serverın mesajı  user:bu bu diyor
                user: {
                    _id: newUser._id,
                    fullName: newUser.fullName,
                    username: newUser.username,
                    gender: newUser.gender,
                    profilePic: newUser.profilePic
                }
            });
        } else {
            res.status(400).send({message: "Error creating user"});
        }

    } catch (error) {
        res.status(500).send({message: error.message});
    }
};

export const login = async (req, res) => {
  try {
    const {username, password} = req.body; //bodyden kullanıcı adı ve şifre al
    const user = await User.findOne({username: username}); //users collectionında kullanıcıyı bul
    
    if(!user) {
        return res.status(400).send({message: "User does not exist"});
    }
    const isPasswordCorrect = await bcyrpt.compare(password, user.password); //bcrypt ile hashlenmiş şifreyi karşılaştır
    if(!isPasswordCorrect) {
        return res.status(400).send({message: "Invalid username or password"});
    }
    // Generate token and set cookie
    generateTokenAndSetCookie(user, res); //auth işlemi başarılı ise token oluştur ve çerezde sakla. Bu token giriş yapan kullanıcıyı tanımlamak için kullanılır. onun giriş kartıdır.

    res.status(200).send({message: "Login successful",//server geri döndürülen mesajı
        user: {
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            gender: user.gender,
            profilePic: user.profilePic
        }
    });
    } catch (error) {
        res.status(500).send({message: error.message});
    }
}

export const logout = (req, res) => {
  try{
    res.clearCookie("token", {  //çerezi temizle cookieden id ve username silinir.
        httpOnly: true,
        secure: process.env.NODE_ENV === "development",
        sameSite: "strict",
         maxAge: 0
    });
    res.status(200).send({message: "Logout successful"});
  } catch (error) {
    res.status(500).send({message: error.message});
  }
}
