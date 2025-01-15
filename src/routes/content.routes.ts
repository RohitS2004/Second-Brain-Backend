import Router from "express";
import { handleFetchAllPosts } from "../controllers/content.controller";
import { verifyJwt } from "../middlewares/auth.middleware";

const router = Router();

// Verified routes
router.route("/")
.get(verifyJwt ,handleFetchAllPosts);

export default router;