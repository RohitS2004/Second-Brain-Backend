import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { API_VERSION } from "./constants/constants";

export const app = express();

// middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200,
}))
app.use(express.json({ limit: "50kb" }))
app.use(express.urlencoded({ extended: true, limit: "50kb" }))
app.use(express.static("public/images"));
app.use(cookieParser());

// Importing the routes
import userRouter from "./routes/user.routes";
import contentRouter from "./routes/content.routes";

app.use(`${API_VERSION}/user`, userRouter);
app.use(`${API_VERSION}/content`, contentRouter);