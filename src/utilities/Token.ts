import mongoose from "mongoose";
import { User } from "../models/user.model";

export const generateAccessAndRefreshToken = async (id: mongoose.Types.ObjectId) => {
    try { 
        // find the user from the database
        const user = await User.findById(id);
    
        // @ts-ignore
        const generatedAccessToken: string = user.generateAccessToken();
        // @ts-ignore
        const generatedRefreshToken: string = user.generateRefreshToken();
        
        if (user) {
            // @ts-ignore
            user.refreshToken = generatedRefreshToken;
            
            // We have used the validateBeforeSave property in order to prevent the mongoose model validations for every other field to run since we are only saving the refreshToken and not providing any other field
            await user?.save({ validateBeforeSave: false })

        }
        // @ts-ignore
        return { generatedAccessToken, generatedRefreshToken }
    }
    catch (error: any) {
        return null;
    }
}