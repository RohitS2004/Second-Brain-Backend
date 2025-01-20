import Router from "express";
import { handleCreatePost, handleDeletePost, handleFetchPosts, handleGetSpecificPostDetails, handlePostUpdate } from "../controllers/content.controller";
import { verifyJwt } from "../middlewares/auth.middleware";

const router = Router();

// Verified routes
router.route("/:contentType")
.get(verifyJwt ,handleFetchPosts);

router.route("/read/:postId")
.get(verifyJwt, handleGetSpecificPostDetails);

router.route("/create")
.post(verifyJwt, handleCreatePost);

router.route("/delete/:postId")
.get(verifyJwt, handleDeletePost)

router.route("/update/:postId")
.post(verifyJwt, handlePostUpdate);

export default router;