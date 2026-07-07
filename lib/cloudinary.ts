import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

/**
 * Uploads a file buffer to Cloudinary.
 */
export async function uploadStream(
  buffer: Buffer,
  folder: string
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error)
        if (!result) return reject(new Error("Upload failed, no result."))
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        })
      }
    )
    stream.end(buffer)
  })
}

/**
 * Deletes a file from Cloudinary using its public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!publicId) return
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error(`[Cloudinary] Failed to delete asset: ${publicId}`, error)
  }
}
