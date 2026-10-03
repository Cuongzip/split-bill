import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImageToCloudinary(
  fileOrBase64: string,
  folder = "split-bill/receipts"
): Promise<string> {
  const isConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (!isConfigured) {
    console.warn("Cloudinary chưa được cấu hình trong .env.local, giữ nguyên ảnh gốc.");
    return fileOrBase64;
  }

  if (!fileOrBase64.startsWith("data:image/")) {
    return fileOrBase64;
  }

  try {
    const result = await cloudinary.uploader.upload(fileOrBase64, {
      folder,
      resource_type: "image",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Lỗi khi upload ảnh lên Cloudinary:", error);
    return fileOrBase64;
  }
}

export async function uploadImageBufferToCloudinary(
  buffer: Buffer,
  folder = "split-bill/receipts"
): Promise<string> {
  const isConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (!isConfigured) {
    throw new Error("Vui lòng cấu hình CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET trong .env.local");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Lỗi upload ảnh lên Cloudinary"));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export default cloudinary;
