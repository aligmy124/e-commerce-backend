import cloudinary from "../config/cloudinary";

export const uploadImage = async (
  buffer: Buffer,
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ecommerce/products",
        resource_type: "image",
      },

      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
};
// upload images

export const uploadImages = async (
  files: Express.Multer.File[],
): Promise<
  {
    url: string;
    publicId: string;
  }[]
> => {
  const uploadedImages: {
    url: string;
    publicId: string;
  }[] = [];

  try {
    for (const file of files) {
      const image = await uploadImage(file.buffer);
      uploadedImages.push(image);
    }
    return uploadedImages;
  } catch (error) {
    await Promise.all(
      uploadedImages.map((image) => deleteCloudinaryImages(image.publicId)),
    );
    throw error;
  }
};

// delete Image

export const deleteCloudinaryImages = async (
  publicId: string,
): Promise<void> => {
  const result = await cloudinary.uploader.destroy(publicId);
  if (result.result !== "ok") {
    throw new Error("cloudinary failed images");
  }
};
