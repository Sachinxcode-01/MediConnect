import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a file buffer or local path to Cloudinary
 * @param {string} filePathOrBase64 - Local file path or base64 data URI
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadToCloudinary = async (filePathOrBase64, folder = 'mediconnect') => {
  const result = await cloudinary.uploader.upload(filePathOrBase64, {
    folder,
    resource_type: 'auto',
  });
  return { url: result.secure_url, publicId: result.public_id };
};

/**
 * Delete a file from Cloudinary by its public ID
 * @param {string} publicId
 */
export const deleteFromCloudinary = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
