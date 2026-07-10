import User from "../models/user.model.js";

const generateFriendCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let exists = true;

    // Unique olana kadar dene
    while (exists) {
        code = '';
        for (let i = 0; i < 4; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        // Bu kod daha önce kullanılmış mı kontrol et
        const user = await User.findOne({ friendCode: code });
       
        if (user){
        exists = true;
       }else{
        exists = false;
       } // Eğer user varsa exists = true
    }

    return code;
};

export default generateFriendCode;
