import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt";

interface User {
    username: string,
    email: string,
    password: string,
    associatedPosts: mongoose.Schema.Types.ObjectId[],
    profilePicture: string,
    refreshToken?: string,
}

const userSchema = new mongoose.Schema<User>({
    username: {
        type: String,
        required: true,
        lowercase: true, 
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        required: true,
    },
    associatedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }],
    refreshToken: {
        type: String,
    }
}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password: string) {
    return await bcrypt.compare(password, this.password) // returns a boolean 
}

userSchema.methods.generateAccessToken = function () {
    // generate the access token and return back
    return jwt.sign(
        {
            _id: this._id
        },
        String(process.env.ACCESS_TOKEN_SECRET),
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    // generate refresh token and return back
    return jwt.sign(
        {
            _id: this._id,
        },
        String(process.env.REFRESH_TOKEN_SECRET),
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
        }
    )
}

export const User = mongoose.model<User>("User", userSchema);
