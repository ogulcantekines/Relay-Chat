import express from "express";
import { sendMessage, getMessage } from "../controller/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import { clearConversation } from "../controller/message.controller.js";
import { editMessage } from "../controller/message.controller.js";
import { deleteMessage } from "../controller/message.controller.js";


const router = express.Router();

router.get("/:id", protectRoute, getMessage);
router.post("/send/:id", protectRoute, sendMessage);
router.delete("/clear/:id", protectRoute, clearConversation);
router.put("/edit/:id", protectRoute, editMessage);
router.delete("/:id", protectRoute, deleteMessage);






export default router;
