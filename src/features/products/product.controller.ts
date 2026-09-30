// import { RequestHandler } from "express";
// import {
//   createProduct,
//   deleteProduct,
//   getProductDetails,
//   getProducts,
//   updateProduct,
// } from "./product.service";
// import { uploadImages } from "../../services/cloudinary.service";

// export const createProductController: RequestHandler = async (
//   req,
//   res,
//   next,
// ) => {
//   try {
//     const files = req.files as Express.Multer.File[];

//     if (!files || files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "images are required",
//       });
//     }

//     const uploadedImages = await uploadImages(files);

//     const images = uploadedImages.map((image) => ({
//       url: image.url,
//       publicId: image.publicId,
//       alt: req.body.name,
//     }));

//     const product = await createProduct({
//       ...req.body,
//       images,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       data: product,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// export const getProductsController: RequestHandler = async (req, res, next) => {
//   try {
//     const { search, categoryId, minPrice, maxPrice, minRating, isActive } =
//       req.query;

//     const products = await getProducts({
//       search: search as string | undefined,
//       categoryId: categoryId as string | undefined,
//       minPrice: minPrice ? Number(minPrice) : undefined,
//       maxPrice: maxPrice ? Number(maxPrice) : undefined,
//       minRating: minRating ? Number(minRating) : undefined,
//       isActive: isActive !== undefined ? isActive === "true" : undefined,
//     });

//     return res.status(200).json({
//       success: true,
//       count: products.pagination.totalProducts,
//       data: products,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getProductDetailsController: RequestHandler<{
//   productId: string;
// }> = async (req, res, next) => {
//   try {
//     const { productId } = req.params;

//     const product = await getProductDetails(productId);

//     return res.status(200).json({
//       success: true,
//       data: product,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// // update
// export const updateProductController: RequestHandler<{
//   productId: string;
// }> = async (req, res, next) => {
//   try {
//     const { productId } = req.params;
//     const files = req.files as Express.Multer.File[];
//     let images;
//     if (files && files.length > 0) {
//       const uploadedImages = await uploadImages(files);
//       images = uploadedImages.map((image) => ({
//         url: image.url,
//         publicId: image.publicId,
//         alt: req.body.name ?? "Product image",
//       }));
//     }

//     const updatedProduct = await updateProduct(productId, {
//       ...req.body,
//       ...(images && { images }),
//     });

//     return res.status(200).json({
//       success: true,
//       message: "product updated successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// export const deleteProductController: RequestHandler<{
//   productId: string;
// }> = async (req, res, next) => {
//   try {
//     const { productId } = req.params;

//     await deleteProduct(productId);

//     return res.status(200).json({
//       success: true,
//       message: "Product becomes unavailable",
//     });
//   } catch (error) {
//     next(error);
//   }
// };
import { RequestHandler } from "express";
import {
  createProduct,
  deleteProduct,
  getProductDetails,
  getProducts,
  updateProduct,
} from "./product.service";
import { uploadImages } from "../../services/cloudinary.service";

export const createProductController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files?.length) {
      return res.status(400).json({
        success: false,
        message: "Images are required",
      });
    }

    const uploadedImages = await uploadImages(files);

    const images = uploadedImages.map((image) => ({
      url: image.url,
      publicId: image.publicId,
      alt: req.body.name,
    }));

    const product = await createProduct({
      ...req.body,
      images,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      minRating,
      isActive,
      page,
      limit,
    } = req.query;

    const result = await getProducts({
      search: search as string | undefined,
      categoryId: categoryId as string | undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      isActive:
        isActive !== undefined
          ? isActive === "true"
          : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductDetailsController: RequestHandler<{
  productId: string;
}> = async (req, res, next) => {
  try {
    const product = await getProductDetails(
      req.params.productId,
    );

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductController: RequestHandler<{
  productId: string;
}> = async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];

    let images;

    if (files?.length) {
      const uploadedImages = await uploadImages(files);

      images = uploadedImages.map((image) => ({
        url: image.url,
        publicId: image.publicId,
        alt: req.body.name ?? "Product image",
      }));
    }

    const product = await updateProduct(
      req.params.productId,
      {
        ...req.body,
        ...(images && { images }),
      },
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductController: RequestHandler<{
  productId: string;
}> = async (req, res, next) => {
  try {
    const product = await deleteProduct(
      req.params.productId,
    );

    return res.status(200).json({
      success: true,
      message: "Product became unavailable",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};