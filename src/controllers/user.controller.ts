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

export const handleUserInfo = async (req: Request, res: Response, next: NextFunction) => {
    // return the profile picture url and the username

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
    // Get the user data from the frontend
    // username, email, password
    // check if anyone of them is empty and run validations on them
    // If yes then send a response that the username, email or password is mandatory
    // If not then check if there already exists a user with the provided username or email
    // If there already exists a user with the given email or username then send a response that a user with similar name already exists
    // If not then get the local path of the profile picture provided by the user
    // If there is not any local profile path then send a response that the profile picture is mandatory
    // If there is a local profile picture path then upload that image to the cloudinary and get the public url for that image
    // If the public profile image url is not present then send a response that the upload to cloudinary has failed please try again
    // If we have a public url for the profile image than create a user object
    // Now create the user in the database with the help of the User model
    // If the user is created successfully then remove the refresh token and the password field from the created user and send the rest of the info to the user in the response

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
            // console.log(
            //     "Profile picture url at line 81 approx: ",
            //     profilePicturePublicUrl
            // );
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
        // console.log("Username at line 103 approx: ", user?.username);

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
    // get the user details from the frontend
    // username or email based login and the password
    // run the validations on the provided data
    // check if there exists a user in the database or not
    // if there does not exists a user in the database then send a response to the user that the user with the provided email and password does not exists
    // if yes, there exists a user with the given username or email then validate the password from the password stored in the database
    // if the validation is false then send a response that the password provided is incorrect
    // if the validation is true then, generate tokens
    // generate the access and refresh tokens for the user and save the refresh token in the database with validateBeforeSave set as false
    // then send the tokens in the cookies to the frontend both tokens
    // send the tokens in the JSON data, in case user wants to locally save them

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
    // What is the main purpose of signout? To clear the access and refresh token from the cookies and from the database also
    // Get the user object from the req parameter
    // remove the refresh token from the db
    // clear the cookies

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

export const handleBothTokenRefresh = async () => {
    
}
