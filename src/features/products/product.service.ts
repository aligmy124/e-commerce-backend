// import mongoose from "mongoose";
// import { AppError } from "../../utils/AppError";
// import { Category } from "../../models/categories/models/category.model";
// import { Product } from "../../models/products/models/product.model";
// import { deleteCloudinaryImages } from "../../services/cloudinary.service";

// interface CreateProductInput {
//   name: string;
//   description: string;
//   brand: string;
//   price: number;
//   stock: number;
//   isActive?: boolean;
//   categoryId: string;
//   images?: {
//     url: string;
//     alt: string;
//     publicId: string;
//   }[];
// }
// interface GetProductsQuery {
//   search?: string;
//   categoryId?: string;
//   minPrice?: number;
//   maxPrice?: number;
//   minRating?: number;
//   isActive?: boolean;

//   page?: number;
//   limit?: number;
// }
// interface UpdateProductProps {
//   name?: string;
//   description?: string;
//   brand?: string;
//   price?: number;
//   stock?: number;
//   categoryId?: string;
//   isActive?: boolean;
//   images?: {
//     url: string;
//     publicId: string;
//     alt: string;
//   }[];
// }

// export const createProduct = async (data: CreateProductInput) => {
//   const category = await Category.findById(data.categoryId);
//   if (!category) {
//     throw new AppError("Category not found", 404);
//   }
//   if (category.isActive === false) {
//     throw new AppError("Category is not active now", 400);
//   }

//   const product = await Product.create(data);

//   return product;
// };

// export const getProducts = async (query: GetProductsQuery) => {
//   const filter: Record<string, any> = {};

//   // Search
//   if (query.search) {
//     filter.$or = [
//       { name: { $regex: query.search, $options: "i" } },
//       { brand: { $regex: query.search, $options: "i" } },
//     ];
//   }

//   // Category
//   if (query.categoryId) {
//     filter.categoryId = query.categoryId;
//   }

//   // Price
//   if (query.minPrice !== undefined || query.maxPrice !== undefined) {
//     filter.price = {};

//     if (query.minPrice !== undefined) {
//       filter.price.$gte = query.minPrice;
//     }

//     if (query.maxPrice !== undefined) {
//       filter.price.$lte = query.maxPrice;
//     }
//   }

//   // Rating
//   if (query.minRating !== undefined) {
//     filter.averageRating = {
//       $gte: query.minRating,
//     };
//   }

//   // Active
//   if (query.isActive !== undefined) {
//     filter.isActive = query.isActive;
//   }
//   const page = query.page ?? 1;
//   const limit = query.limit ?? 10;
//   const skip = (page - 1) * limit;
//   const [products, totalProducts] = await Promise.all([
//     Product.find(filter).skip(skip).limit(limit).lean(),
//     Product.countDocuments(filter),
//   ]);

//   return {
//     products,
//     pagination: {
//       page,
//       limit,
//       totalProducts,
//       totalPages: Math.ceil(totalProducts / limit),
//     },
//   };
// };

// export const getProductDetails = async (productId: string) => {
//   const product = await Product.findById(productId).lean();

//   if (!product) {
//     throw new AppError("Product not found", 404);
//   }

//   return product;
// };

// export const deleteProduct = async (productId: string) => {
//   const product = await Product.findOneAndUpdate(
//     {
//       _id: productId,
//       isActive: true,
//     },
//     {
//       isActive: false,
//     },
//     {
//       returnDocument: "after",
//       runValidators: true,
//     },
//   ).lean();

//   if (!product) {
//     throw new AppError("Product not found", 404);
//   }

//   return product;
// };

// // update
// export const updateProduct = async (
//   productId: string,
//   data: UpdateProductProps,
// ) => {
//   const session = await mongoose.startSession();

//   let oldImages: typeof data.images = [];
//   let newImages: typeof data.images = [];

//   try {
//     session.startTransaction();

//     // 1. Get current product
//     const product = await Product.findById(productId).session(session);

//     if (!product) {
//       throw new AppError("Product not found", 404);
//     }

//     oldImages = product.images;

//     // Keep track of new images
//     if (data.images) {
//       newImages = data.images;
//     }

//     // 2. Update MongoDB
//     const updatedProduct = await Product.findByIdAndUpdate(productId, data, {
//       returnDocument: "after",
//       runValidators: true,
//       session,
//     }).lean();

//     if (!updatedProduct) {
//       throw new AppError("Product not found", 404);
//     }

//     // 3. Commit MongoDB transaction
//     await session.commitTransaction();

//     // 4. Delete old images only if new images replaced them
//     if (data.images) {
//       await Promise.all(
//         oldImages.map((image) => deleteCloudinaryImages(image.publicId)),
//       );
//     }

//     return updatedProduct;
//   } catch (error) {
//     // MongoDB rollback
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }

//     // MongoDB failed AFTER new images were uploaded
//     // → delete new images to avoid orphan files
//     if (newImages.length > 0) {
//       await Promise.allSettled(
//         newImages.map((image) => deleteCloudinaryImages(image.publicId)),
//       );
//     }

//     throw error;
//   } finally {
//     await session.endSession();
//   }
// };
import mongoose from "mongoose";
import { Category } from "../../models/categories/models/category.model";
import { Product } from "../../models/products/models/product.model";
import { deleteCloudinaryImages } from "../../services/cloudinary.service";
import { AppError } from "../../utils/AppError";

interface CreateProductInput {
  name: string;
  description: string;
  brand: string;
  price: number;
  stock: number;
  isActive?: boolean;
  categoryId: string;
  images?: {
    url: string;
    alt: string;
    publicId: string;
  }[];
}

interface GetProductsQuery {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

interface UpdateProductProps {
  name?: string;
  description?: string;
  brand?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  isActive?: boolean;
  images?: {
    url: string;
    publicId: string;
    alt: string;
  }[];
}

export const createProduct = async (
  data: CreateProductInput,
) => {
  const categoryExists = await Category.exists({
    _id: data.categoryId,
    isActive: true,
  });

  if (!categoryExists) {
    throw new AppError(
      "Category not found or inactive",
      404,
    );
  }

  return Product.create(data);
};

export const getProducts = async (
  query: GetProductsQuery,
) => {
  const filter: Record<string, any> = {};

  if (query.search) {
    filter.$text = {
      $search: query.search,
    };
  }

  if (query.categoryId) {
    filter.categoryId = query.categoryId;
  }

  if (
    query.minPrice !== undefined ||
    query.maxPrice !== undefined
  ) {
    filter.price = {};

    if (query.minPrice !== undefined) {
      filter.price.$gte = query.minPrice;
    }

    if (query.maxPrice !== undefined) {
      filter.price.$lte = query.maxPrice;
    }
  }

  if (query.minRating !== undefined) {
    filter.averageRating = {
      $gte: query.minRating,
    };
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(
    Math.max(query.limit ?? 10, 1),
    100,
  );

  const skip = (page - 1) * limit;

  const [products, totalProducts] = await Promise.all([
    Product.find(filter)
      .select(
        "name brand price stock averageRating images isActive categoryId",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      totalProducts,
      totalPages: Math.ceil(
        totalProducts / limit,
      ),
    },
  };
};

export const getProductDetails = async (
  productId: string,
) => {
  const product = await Product.findById(productId)
    .select(
      `
      name
      description
      brand
      price
      stock
      averageRating
      totalReviews
      images
      isActive
      categoryId
    `,
    )
    .populate("categoryId", "name")
    .lean();

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

export const deleteProduct = async (
  productId: string,
) => {
  const product = await Product.findOneAndUpdate(
    {
      _id: productId,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
      },
    },
    {
      new: true,
    },
  ).lean();

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

export const updateProduct = async (
  productId: string,
  data: UpdateProductProps,
) => {
  const session = await mongoose.startSession();

  let oldImages: {
    publicId: string;
  }[] = [];

  let newImages =
    data.images?.map((image) => ({
      publicId: image.publicId,
    })) ?? [];

  try {
    session.startTransaction();

    const product = await Product.findById(productId)
      .select("images")
      .session(session)
      .lean();

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    oldImages = product.images.map((image) => ({
      publicId: image.publicId,
    }));

    const updatedProduct =
      await Product.findByIdAndUpdate(
        productId,
        {
          $set: data,
        },
        {
          new: true,
          runValidators: true,
          session,
        },
      ).lean();

    await session.commitTransaction();

    if (data.images?.length) {
      await Promise.allSettled(
        oldImages.map((image) =>
          deleteCloudinaryImages(
            image.publicId,
          ),
        ),
      );
    }

    return updatedProduct;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (newImages.length > 0) {
      await Promise.allSettled(
        newImages.map((image) =>
          deleteCloudinaryImages(
            image.publicId,
          ),
        ),
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};