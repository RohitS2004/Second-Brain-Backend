import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const configCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    })
}

export const uploadImageToCloudinary = async (localFilePath: string) => {
    try {
        if (!localFilePath) {
            throw new Error("No such local file path exists");
        }
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
        console.log("Public URL from cloudinary utility file at line 18: ",response.url);
        // unlink the file uploaded locally to the server by the multer middleware
        fs.unlinkSync(localFilePath);
        return response.url;
    }
    catch (error: any) {
        fs.unlinkSync(localFilePath);
        throw new Error("Error occurred while uploading file to cloudinary");
    }
}