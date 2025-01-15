import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

// configure the cloudinary
import { configCloudinary } from "./utilities/Cloudinary";
configCloudinary();

// connecting to the mongodb database
import { connectToDb } from "./db/db";
import { app } from "./app";

connectToDb()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`App is listening on port: ${process.env.PORT}`);
    })
    app.on("error", () => {
        console.log("Something went wrong while booting the server");
    })
})
.catch((error: any) => {
    console.log(error);
})