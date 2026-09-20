import express from "express";
import { sendMessage, getMessage } from "../controller/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import { clearConversation } from "../controller/message.controller.js";
import { editMessage } from "../controller/message.controller.js";
import { deleteMessage } from "../controller/message.controller.js";
import { getUnreadCounts } from "../controller/message.controller.js";
import { reactToMessage } from "../controller/message.controller.js";


import { validateIds } from "../utils/validation.js";

const router = express.Router();
router.param("id", validateIds);

router.get("/unread/counts", protectRoute, getUnreadCounts); // /:id'den önce tanımlı olmalı
router.get("/:id", protectRoute, getMessage);
router.post("/send/:id", protectRoute, sendMessage);
router.delete("/clear/:id", protectRoute, clearConversation);
router.put("/edit/:id", protectRoute, editMessage);
router.post("/react/:id", protectRoute, reactToMessage);
router.delete("/:id", protectRoute, deleteMessage);






export default router;
