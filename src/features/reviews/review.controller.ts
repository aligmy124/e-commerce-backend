// import { RequestHandler } from "express";
// import { addReview, getReviews, getReviewsProduct} from "./review.service";

// export const addReviewController: RequestHandler<{
//   productId: string;
// }> = async (req, res, next) => {
//   try {
//     const { productId } = req.params;
//     const { rating, comment } = req.body;

//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const review = await addReview(productId, req.user.id, {
//       rating,
//       comment,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "review added successfully",
//       data: review,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getReviewProductController: RequestHandler<{
//   productId: string;
// }> = async (req, res, next) => {
//   try {
//     const { productId } = req.params;

//     const reviews = await getReviewsProduct(productId);

//     return res.status(200).json({
//       success: true,
//       data: reviews,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// // export const getSpecificReviewProductController: RequestHandler<{
// //   productId: string;
// // }> = async (req, res, next) => {
// //   try {
// //     const { productId } = req.params;

// //     const reviews = await getSpecificReviewsProduct(productId);

// //     return res.status(200).json({
// //       success: true,
// //       data: reviews,
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // };
// export const getAllReviewController: RequestHandler = async (req, res, next) => {
//   const reviews = await getReviews();

//   return res.status(200).json({
//     success: true,
//     data: reviews,
//   });
// };
import { RequestHandler } from "express";
import {
  addReview,
  deleteReview,
  getProductReviews,
  getReviews,
} from "./review.service";

export const addReviewController: RequestHandler<{
  productId: string;
}> = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const review = await addReview(
      req.params.productId,
      req.user.id,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductReviewsController: RequestHandler<{
  productId: string;
}> = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const reviews = await getProductReviews(
      req.params.productId,
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      data: reviews.reviews,
      pagination: reviews.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReviewsController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const reviews = await getReviews(
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      data: reviews.reviews,
      pagination: reviews.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReviewController: RequestHandler<{
  reviewId: string;
}> = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const review = await deleteReview(
      req.params.reviewId,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};