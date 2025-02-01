import Router from "express";
import { handleBothTokenRefresh, handleUserInfo, handleUserSignin, handleUserSignout, handleUserSignup } from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import { verifyJwt } from "../middlewares/auth.middleware";

const router = Router();

// verified routes
router.route("")
.get(verifyJwt, handleUserInfo)

// Create the signup route ✅
// Create the signin route
// Create the signout route

router.route("/signup")
.post(upload.fields([
    {
        name: "profilePicture",
        maxCount: 1,
    }
]) ,handleUserSignup);

router.route("/signin")
.post(handleUserSignin);

router.route("/signout")
.post(verifyJwt, handleUserSignout);

router.route("/refresh-tokens")
.post(handleBothTokenRefresh);

export default router;