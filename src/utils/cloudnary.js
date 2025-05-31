import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDNARY_NAME,
  api_key: process.env.CLOUDNARY_API_TOKEN,
  api_secret: process.env.CLOUDNARY_API_SECRET,
});

const uploadonCoudnary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload a file
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("file is uploaded successfully", response.url);
    return response;
  } catch (error) {
    fs.unlink(localFilePath); //remove the locally saved temporary file as the upload operation got failed
    console.log("uploading error:", error);
    return null;
  }
};

export { uploadonCoudnary };
