import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import {
    searchUsers,
    sendFriendRequest,
    respondToFriendRequest,
    getFriends,
    getFriendRequests,
    removeFriend,
    getSentFriendRequests,
    cancelFriendRequest
} from "../controller/friend.controller.js";

const router = express.Router();
//bizim backend serverımıza istek atarken /api kullanıyoruz. var olan bir başka servera istek atacak olsaydık
// /google.com gibi giderdi

router.get("/search", protectRoute, searchUsers);
router.post("/send/:receiverId", protectRoute, sendFriendRequest);
router.post("/respond", protectRoute, respondToFriendRequest);
router.get("/list", protectRoute, getFriends);
router.get("/requests", protectRoute, getFriendRequests);
router.delete("/remove/:friendId", protectRoute, removeFriend);
router.get("/sentRequests", protectRoute, getSentFriendRequests);
router.delete("/cancel/:requestId", protectRoute, cancelFriendRequest);

export default router;

// 📌 Not: Tüm route'lar protectRoute middleware'i ile korunuyor
// Bu middleware JWT token kontrolü yapar, giriş yapmamış kullanıcılar bu endpoint'lere erişemez
// protectRoute → req.user'a giriş yapan kullanıcının bilgilerini ekler, controller'da req.user._id ile erişiriz
