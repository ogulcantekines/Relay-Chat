import User from "../models/user.model.js";

// Sidebar için kullanıcı listesini al

export const getUsersForSidebar = async (req, res) => {
    try {

        const loggedInUserId = req.userId; //protected route middleware'den gelen userId. giriş yapan kullanıcı çereze kaydediliyor ve istek atabiliyor
        if (!loggedInUserId) {
            return res.status(401).send("Unauthorized");
        }

        // users collection'dan giriş yapan kullanıcı hariç tüm kullanıcıları al (fullName, username, profilePic alanlarıyla)
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }, 'fullName username profilePic'); // Sadece gerekli alanları al
        res.status(200).json(filteredUsers); //server tarafında json formatında döndür. clientta ise .json ile js objesine çevirrilir
        
    } catch (error) {
        console.error("Error fetching users for sidebar:", error);
        res.status(500).send("Internal Server Error");
    }
};

