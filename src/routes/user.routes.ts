import Router from "express";
import { handleUserSignin, handleUserSignout, handleUserSignup } from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import { verifyJwt } from "../middlewares/auth.middleware";

const router = Router();

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

export default router;