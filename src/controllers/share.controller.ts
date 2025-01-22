import { NextFunction, Request, Response } from "express";
import { JSON_RESPONSE, STATUS_CODE } from "../types/types";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export const handleShare = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // get the username from the user in the request
    // generate a new jwt token with the username inside it and an expiry of 1 hour only
    // if the token is generated successfully then return this token to the frontend
    try {
        // @ts-ignore
        const user = req.user;

        const token = jwt.sign(
            {
                username: user.username,
            },
            String(process.env.SHARE_TOKEN_SECRET),
            {
                expiresIn: process.env.SHARE_TOKEN_EXPIRY,
            }
        );

        res.status(<STATUS_CODE>200).json(<JSON_RESPONSE>{
            status: "success",
            message: "Link generated successfully",
            data: {
                token,
            },
        });
    } catch (error: any) {
        res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while generating the link",
        });
    }
};

export const handleShareToPublic = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // get the token from the url
    // verify it, get the data from it
    // run a query to the database and get all the associatedPosts(if any) otherwise return user has not posts
    // return all the posts to the frontend
    // We should return the username and his profile picture also to the frontend
    try {
        const token = req.params.token;

        const data = jwt.verify(token, String(process.env.SHARE_TOKEN_SECRET));

        const user = await User.findOne({
            // @ts-ignore
            username: data.username,
        });

        if (!user) {
            res.status(<STATUS_CODE>400).json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Invalid request!",
            });
            return;
        }

        const associatedPosts = user.associatedPosts;

        res.status(<STATUS_CODE>200)
        .json(<JSON_RESPONSE>{
            status: "success",
            message: "User's posts!",
            data: {
                associatedPosts: associatedPosts,
                username: user.username,
                profilePicture: user.profilePicture,
            }
        })

    } catch (error: any) {}
};
