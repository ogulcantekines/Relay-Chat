import express from "express";
import {login,logout,signup } from "../controller/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);


router.post("/login", login);


router.post("/logout", logout);


export default router;

// In your server.js file, you would import and use this router as follows:
// import authRoute from './routes/auth.route.js';
// app.use("/api/auth", authRoute);