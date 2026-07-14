import type { Request, Response } from "express";
import { sendResponse } from "../utils/response.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";

export const uploadImage = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return sendResponse(res, 400, false, "No image file provided");
    }

    const imageUrl = await uploadImageToCloudinary(req.file.buffer);

    return sendResponse(res, 200, true, "Image uploaded successfully", {
      url: imageUrl,
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Failed to upload image");
  }
};
