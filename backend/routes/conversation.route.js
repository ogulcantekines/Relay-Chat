import express from "express";
import { getConversations } from "../controller/conversation.controller.js";
import { getConversationsByStatus } from "../controller/conversation.controller.js";
import { acceptConversation } from "../controller/conversation.controller.js";
import protectRoute from "../middleware/protectRoute.js";


const router = express.Router();

router.get("/", protectRoute, getConversations);
router.get("/status/:status", protectRoute, getConversationsByStatus);
router.put("/accept/:id", protectRoute, acceptConversation);

export default router;

