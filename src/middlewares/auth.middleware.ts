import { NextFunction, Request, Response } from "express";
import { JSON_RESPONSE, STATUS_CODE } from "../types/types";
import { User } from "../models/user.model";
import jwt from "jsonwebtoken";

export const verifyJwt = async (req: Request, res: Response, next: NextFunction) => {
    // get the access token from the cookies or the Authorization header
    // if not token then send a response that it is a unauthorized request
    // If there is a token then get the user from the database and remove the password and refresh token field from that object
    // attach this user object in the req 
    // call the next function

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            res.status(<STATUS_CODE>400)
            .json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Unauthorized request!"
            }) // json goes in  the response data
            return;
        }

        if (token.exp < Math.floor(Date.now() / 1000)) {
            // Token has expired
            res.status(<STATUS_CODE>408)
            .json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Token has expired!"
            })
            return;
        }

        const data = jwt.verify(token, String(process.env.ACCESS_TOKEN_SECRET));

        // @ts-ignore
        const user = await User.findById(data._id).select("-password -refreshToken");

        if (!user) {
            res.status(<STATUS_CODE>400)
            .json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Invalid access token!"
            })
            return;
        }

        // @ts-ignore
        req.user = user;
        next();
    }
    catch (error: any) {
        res.status(<STATUS_CODE>500)
        .json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while signing out the user, please try again!"
        })
    }
}