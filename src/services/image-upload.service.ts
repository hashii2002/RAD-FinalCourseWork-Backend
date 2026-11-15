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
          console.error("Cloudinary Upload Error Details:");

          console.dir(error, {
            depth: null,
            colors: true,
          });

          console.error("Error Properties:", {
            name: error.name,
            message: error.message,
            http_code: error.http_code,
            stack: error.stack,
          });

          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary returned an empty upload result."));
          return;
        }

        console.log("Cloudinary Upload Successful:", result.secure_url);

        resolve(result.secure_url);
      }
    );

    const readableStream = Readable.from([fileBuffer]);

    readableStream.on("error", (error) => {
      console.error("Image Read Stream Error:", error);
      reject(error);
    });

    uploadStream.on("error", (error) => {
      console.error("Cloudinary Stream Error:", error);
      reject(error);
    });

    readableStream.pipe(uploadStream);
  });
};

export default uploadImageToCloudinary;
