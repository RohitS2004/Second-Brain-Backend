import { NextFunction, Request, Response } from "express";
import { JSON_RESPONSE, STATUS_CODE } from "../types/types";
import {
    emailValidator,
    passwordValidator,
    usernameValidator,
} from "../utilities/Validation";
import { User } from "../models/user.model";
import { uploadImageToCloudinary } from "../utilities/Cloudinary";
import { generateAccessAndRefreshToken } from "../utilities/Token";
import { options } from "../constants/constants";
import jwt from "jsonwebtoken";

export const handleUserInfo = async (req: Request, res: Response, next: NextFunction) => {

    // @ts-ignore
    const user = req.user;

    res.status(<STATUS_CODE>200)
    .json(<JSON_RESPONSE>{
        status: "success",
        message: "User info!",
        data: {
            username: user.username,
            profilePicture: user.profilePicture, 
        }
    })
}

export const handleUserSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        let { username, email, password } = req.body;
        let profilePictureLocalPath;
        let profilePicturePublicUrl;

        if (!username || !email || !password) {
            res.status(<STATUS_CODE>400).json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Please provide all the mandatory fields",
            });
            return;
        }

        username = usernameValidator(username);
        password = passwordValidator(password);
        email = emailValidator(email);

        // if anyone of them is null then return a response that the values provided should match the constraints
        if (!username || !email || !password) {
            res.status(<STATUS_CODE>400).json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Values should satisfy the required conditions",
            });
            return;
        }

        const existedUser = await User.findOne({
            $or: [{ username }, { email }],
        }); // finds the user on the basis of one of the field (username or email)

        if (existedUser) {
            res.status(<STATUS_CODE>400).json(<JSON_RESPONSE>{
                status: "client_error",
                message: "User with the provided username already exists",
            });
            return;
        }

        if (req.files && "profilePicture" in req.files) {
            profilePictureLocalPath = req.files.profilePicture[0].path;
        } else {
            res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
                status: "server_error",
                message: "Please try to upload the profile picture again",
            });
            return;
        }

        if (profilePictureLocalPath) {
            profilePicturePublicUrl = await uploadImageToCloudinary(
                profilePictureLocalPath
            );
        }

        if (!profilePicturePublicUrl) {
            res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
                status: "server_error",
                message:
                    "Something went wrong while uploading image to the server",
            });
            return;
        }

        const createdUser = await User.create({
            username,
            email,
            password,
            profilePicture: profilePicturePublicUrl,
        });

        const user = await User.findById(createdUser._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
                status: "server_error",
                message: "Something went wrong while signing up the user",
            });
            return;
        }

        res.status(<STATUS_CODE>200).json(<JSON_RESPONSE>{
            status: "success",
            message: "User created successfully!",
            data: {
                user,
            },
        });
    } catch (error: any) {
        res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while registering the user!",
        });
    }
};

export const handleUserSignin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        let { username, email, password } = req.body;
        console.log(username, email, password);

        username = username.toLowerCase().trim();
        email = email.toLowerCase().trim();
        password = password.trim();

        const existedUser = await User.findOne({
            $or: [{ username }, { email }],
        });

        if (!existedUser) {
            res.status(<STATUS_CODE>400).json(<JSON_RESPONSE>{
                status: "client_error",
                message: "No user with the given username or email exists",
            });
            return;
        }

        console.log(existedUser);

        // @ts-ignore
        const userValidated: boolean = await existedUser.isPasswordCorrect(
            password
        );
        console.log("User is validated line 170 approx: ", userValidated);

        if (!userValidated) {
            res.status(<STATUS_CODE>400).json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Provided password is incorrect",
            });
            return;
        }

        const loggedInUser = await User.findById(existedUser._id).select(
            "-password -refreshToken"
        );

        const tokens = await generateAccessAndRefreshToken(existedUser._id);
        if (!tokens) {
            res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
                status: "server_error",
                message: "Something went wrong while generating the tokens",
            });
            return;
        }

        const accessToken = tokens.generatedAccessToken;
        const refreshToken = tokens.generatedRefreshToken;

        res.status(<STATUS_CODE>200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(<JSON_RESPONSE>{
                status: "success",
                message: "User logged in successfully!",
                data: {
                    loggedInUser,
                },
            });
    } catch (error: any) {
        res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while signing in, please try again!",
        });
    }
};

export const handleUserSignout = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        // @ts-ignore
        await User.findByIdAndUpdate(req.user._id, {
            $unset: {
                refreshToken: 1 // this removes the field from the document
            },
        }, {
            new: true, // returns the new updated object
        })

        res.status(<STATUS_CODE>200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(<JSON_RESPONSE>{
            status: "success",
            message: "User logged out successfully!"
        })
    }
    catch (error: any) {
        res.status(<STATUS_CODE>500)
        .json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while signing out the user, please try again!",
        })
    }
};

export const handleBothTokenRefresh = async (req: Request, res: Response, next: NextFunction) => {
    
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            res.status(<STATUS_CODE>400)
            .json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Invalid request"
            })
            return;
        }

        const decodedInfo = jwt.verify(incomingRefreshToken, String(process.env.REFRESH_TOKEN_SECRET));

        if (!decodedInfo) {
            res.status(<STATUS_CODE>400)
            .json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Invalid request!"
            })
            return;
        }

        // @ts-ignore
        const user = await User.findById(decodedInfo._id);

        if (!user) {
            res.status(<STATUS_CODE>400)
            .json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Invalid request!"
            })
            return;
        }

        if (user.refreshToken !== incomingRefreshToken) {
            res.status(<STATUS_CODE>400)
            .json(<JSON_RESPONSE>{
                status: "client_error",
                message: "The refresh token has expired please login in again!"
            })
            return;
        }

        const tokens = await generateAccessAndRefreshToken(user._id);

        const generatedAccessToken = tokens?.generatedAccessToken;
        const generatedRefreshToken = tokens?.generatedRefreshToken;

        // We have to send the user data like username and user profile picture also to the frontend
        res
        .cookie("accessToken", generatedAccessToken)
        .cookie("refreshToken", generatedRefreshToken)
        .status(<STATUS_CODE>200)
        .json(<JSON_RESPONSE>{
            status: "success",
            message: "Token refresh successfully!",
            data: {
                username: user.username,
                profilePicture: user.profilePicture,
            }
        })


    }
    catch (error: any) {
        res.status(<STATUS_CODE>500)
        .json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while refreshing the tokens!"
        })
    }
}


// Handle user signout ✅
// Handle the Token refresh once the token gets expired and user have a valid refresh token stored in his database
// Refactor the code, remove any extra code which is of no use
// Add framer motion little bit
// Handle the AI feature

// * What is AI feature
// There should be a chat model like chatgpt through which the user can ask questions related to his brain and also he will be able to ask the chat bot to summarize his brain and tell me about all the posts related to Elon Musk things like that.

