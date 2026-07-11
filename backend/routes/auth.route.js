import express from "express";
import { login, logout, signup, getMe, updateProfile, changePassword } from "../controller/auth.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/signup", signup);


router.post("/login", login);


router.post("/logout" , protectRoute, logout);


router.get("/me", protectRoute, getMe);


router.put("/profile", protectRoute, updateProfile);


router.put("/password", protectRoute, changePassword);


export default router;

// In your server.js file, you would import and use this router as follows:
// import authRoute from './routes/auth.route.js';
// app.use("/api/auth", authRoute);