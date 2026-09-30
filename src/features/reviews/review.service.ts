// import mongoose from "mongoose";
// import { AppError } from "../../utils/AppError";
// import { Product } from "../../models/products/models/product.model";
// import { Review } from "../../models/reviews/models/review.model";

// interface IReview {
//   rating: number;
//   comment: string;
// }

// export const addReview = async (
//   productId: string,
//   userId: string,
//   data: IReview,
// ) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     // 1. Check if product exists
//     const product = await Product.findById(productId).session(session);

//     if (!product) {
//       throw new AppError("Product not found", 404);
//     }

//     // 2. Create review
//     const [review] = await Review.create(
//       [
//         {
//           userId,
//           productId: product._id,
//           rating: data.rating,
//           comment: data.comment,
//         },
//       ],
//       { session },
//     );

//     // 3. Calculate reviews statistics
//     const stats = await Review.aggregate([
//       {
//         $match: {
//           productId: product._id,
//         },
//       },
//       {
//         $group: {
//           _id: "$productId",
//           averageRating: { $avg: "$rating" },
//           reviewsCount: { $sum: 1 },
//         },
//       },
//     ]).session(session);

//     // 4. Update product statistics
//     if (stats.length > 0) {
//       product.averageRating = stats[0].averageRating;
//       product.reviewsCount = stats[0].reviewsCount;

//       await product.save({ session });
//     }

//     // 5. Commit transaction
//     await session.commitTransaction();

//     return review;
//   } catch (error: any) {
//     // Rollback transaction
//     await session.abortTransaction();

//     // Duplicate review
//     if (error.code === 11000) {
//       throw new AppError("You have already reviewed this product", 409);
//     }

//     throw error;
//   } finally {
//     // Close session
//     await session.endSession();
//   }
// };

// export const getReviewsProduct = async (productId: string) => {
//   const reviews = await Review.aggregate([
//     {
//       $match: {
//         productId: new mongoose.Types.ObjectId(productId),
//       },
//     },
//     {
//       $lookup: {
//         from: "profiles",
//         localField: "userId",
//         foreignField: "userId",
//         as: "profile",
//       },
//     },
//     {
//       $unwind: "$profile",
//     },
//     {
//       $project: {
//         rating: 1,
//         comment: 1,
//         user: {
//           firstName: "$profile.firstName",
//           lastName: "$profile.lastName",
//           avatar: "$profile.avatar",
//         },
//       },
//     },
//   ]);

//   if (reviews.length === 0) {
//     throw new AppError("Reviews not found", 404);
//   }

//   return reviews;
// };

// export const getReviews = async () => {
//   const reviews = await Review.aggregate([
//     {
//       $lookup: {
//         from: "profiles",
//         localField: "userId",
//         foreignField: "userId",
//         as: "profile",
//       },
//     },
//     {
//       $lookup: {
//         from: "products",
//         localField: "productId",
//         foreignField: "_id",
//         as: "product",
//       },
//     },
//     {
//       $unwind: "$profile",
//     },
//     {
//       $unwind: "$product",
//     },
//     {
//       $project: {
//         rating: 1,
//         comment: 1,

//         user: {
//           firstName: "$profile.firstName",
//           lastName: "$profile.lastName",
//           avatar: "$profile.avatar",
//         },

//         product: {
//           name: "$product.name",
//           description: "$product.description",
//           brand: "$product.brand",
//           stock: "$product.stock",
//           images: "$product.images",
//         },
//       },
//     },
//   ]);
//   return reviews;
// };
import mongoose from "mongoose";
import { Product } from "../../models/products/models/product.model";
import { Review } from "../../models/reviews/models/review.model";
import { AppError } from "../../utils/AppError";

interface IReview {
  rating: number;
  comment: string;
}

export const addReview = async (
  productId: string,
  userId: string,
  data: IReview,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const product = await Product.findById(productId)
      .select("averageRating reviewsCount")
      .session(session);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const [review] = await Review.create(
      [
        {
          userId,
          productId,
          rating: data.rating,
          comment: data.comment,
        },
      ],
      {
        session,
      },
    );

    product.averageRating =
      (
        product.averageRating * product.reviewsCount +
        data.rating
      ) /
      (product.reviewsCount + 1);

    product.reviewsCount += 1;

    await product.save({ session });

    await session.commitTransaction();

    return review;
  } catch (error: any) {
    await session.abortTransaction();

    if (error.code === 11000) {
      throw new AppError(
        "You have already reviewed this product",
        409,
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export const getProductReviews = async (
  productId: string,
  page = 1,
  limit = 10,
) => {
  const skip = (page - 1) * limit;

  const reviews = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "profiles",
        localField: "userId",
        foreignField: "userId",
        as: "profile",
      },
    },
    {
      $unwind: {
        path: "$profile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        rating: 1,
        comment: 1,
        createdAt: 1,
        user: {
          firstName: "$profile.firstName",
          lastName: "$profile.lastName",
          avatar: "$profile.avatar",
        },
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const totalReviews = await Review.countDocuments({
    productId,
  });

  return {
    reviews,
    pagination: {
      page,
      limit,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
    },
  };
};

export const getReviews = async (
  page = 1,
  limit = 10,
) => {
  const skip = (page - 1) * limit;

  const [reviews, totalReviews] = await Promise.all([
    Review.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "profiles",
          localField: "userId",
          foreignField: "userId",
          as: "profile",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          rating: 1,
          comment: 1,
          createdAt: 1,

          user: {
            firstName: "$profile.firstName",
            lastName: "$profile.lastName",
            avatar: "$profile.avatar",
          },

          product: {
            _id: "$product._id",
            name: "$product.name",
            brand: "$product.brand",
            images: "$product.images",
          },
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]),

    Review.countDocuments(),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
    },
  };
};

export const deleteReview = async (
  reviewId: string,
  userId: string,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const review = await Review.findOne({
      _id: reviewId,
      userId,
    }).session(session);

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    const product = await Product.findById(
      review.productId,
    ).session(session);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const currentTotalRating =
      product.averageRating * product.reviewsCount;

    product.reviewsCount -= 1;

    if (product.reviewsCount === 0) {
      product.averageRating = 0;
    } else {
      product.averageRating =
        (currentTotalRating - review.rating) /
        product.reviewsCount;
    }

    await review.deleteOne({ session });
    await product.save({ session });

    await session.commitTransaction();

    return review;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};