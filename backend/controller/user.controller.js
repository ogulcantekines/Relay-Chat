import User from "../models/user.model.js";

// Sidebar için kullanıcı listesini al

export const getUsersForSidebar = async (req, res) => {
    try {

        const loggedInUserId = req.userId;
        if (!loggedInUserId) {
            return res.status(401).send("Unauthorized");
        }

        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }, 'fullName username profilePic'); // Sadece gerekli alanları al
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error fetching users for sidebar:", error);
        res.status(500).send("Internal Server Error");
    }
};

