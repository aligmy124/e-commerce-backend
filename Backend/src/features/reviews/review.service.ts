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
  ])
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