import Router from "express"
import { verifyJwt } from "../middlewares/auth.middleware";
import { handleShare, handleShareToPublic } from "../controllers/share.controller";

const router = Router();

router.route("")
.get(verifyJwt, handleShare);

router.route("/public/:token")
.get(handleShareToPublic)

export default router;