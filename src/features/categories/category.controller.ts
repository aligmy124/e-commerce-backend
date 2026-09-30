// import { RequestHandler } from "express";
// import {
//   createCategory,
//   deleteCategory,
//   getCategories,
//   getCategoryByID,
//   updateCategory,
// } from "./category.service";

// export const createCategoryController: RequestHandler = async (
//   req,
//   res,
//   next,
// ) => {
//   try {
//     const category = await createCategory(req.body);

//     return res.status(201).json({
//       success: true,
//       message: "Category created successfully",
//       data: category,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getCategoriesController: RequestHandler = async (
//   req,
//   res,
//   next,
// ) => {
//   try {
//     const categories = await getCategories();

//     return res.status(200).json({
//       success: true,
//       data: categories,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getCategoryByIDController: RequestHandler<{
//   categoryId: string;
// }> = async (req, res, next) => {
//   try {
//     const { categoryId } = req.params;

//     const category = await getCategoryByID(categoryId);

//     return res.status(200).json({
//       success: true,
//       data: category,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const updateCategoryController: RequestHandler<{
//   categoryId: string;
// }> = async (req, res, next) => {
//   try {
//     const { categoryId } = req.params;

//     const category = await updateCategory(
//       categoryId,
//       req.body,
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Category updated successfully",
//       data: category,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const deleteCategoryController: RequestHandler<{
//   categoryId: string;
// }> = async (req, res, next) => {
//   try {
//     const { categoryId } = req.params;

//     const category = await deleteCategory(categoryId);

//     return res.status(200).json({
//       success: true,
//       message: "Category deleted successfully",
//       data: category,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
import { RequestHandler } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "./category.service";

export const createCategoryController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const category = await createCategory(req.body);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoriesController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getCategories({
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.categories,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdController: RequestHandler<{
  categoryId: string;
}> = async (req, res, next) => {
  try {
    const category = await getCategoryById(
      req.params.categoryId,
    );

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController: RequestHandler<{
  categoryId: string;
}> = async (req, res, next) => {
  try {
    const category = await updateCategory(
      req.params.categoryId,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryController: RequestHandler<{
  categoryId: string;
}> = async (req, res, next) => {
  try {
    const category = await deleteCategory(
      req.params.categoryId,
    );

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};