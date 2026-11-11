import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary";

const uploadImageToCloudinary = (fileBuffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "pawpath/pets",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Image upload failed."));
          return;
        }

        resolve(result.secure_url);
      }
    );

    Readable.from([fileBuffer]).pipe(uploadStream);
  });
};

export default uploadImageToCloudinary;
