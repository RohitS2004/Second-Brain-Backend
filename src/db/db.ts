import mongoose from "mongoose";
import { CLOUD_NAME } from "../constants/constants";

export const connectToDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${CLOUD_NAME}`);
        console.log(`MongoDb connected successfully 💚: `, connectionInstance.connection.host);
    }
    catch (error: any) {
        throw new Error("Something went wrong while connecting to the backend!");
    }
}