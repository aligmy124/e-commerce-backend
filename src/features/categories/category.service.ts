// import { AppError } from "../../utils/AppError";
// import { Category } from "../../models/categories/models/category.model";

// interface CreateCategoryProps {
//   name: string;
//   description: string;
//   isActive?: boolean;
// }

// interface UpdateCategoryProps {
//   name?: string;
//   description?: string;
//   isActive?: boolean;
// }

// export const createCategory = async (data: CreateCategoryProps) => {
//   const existingCategory = await Category.findOne({
//     name: data.name,
//   });

//   if (existingCategory) {
//     throw new AppError("Category name already exists", 409);
//   }

//   const category = await Category.create(data);

//   return category;
// };

// export const getCategories = async () => {
//   const categories = await Category.find().lean();

//   return categories;
// };

// export const getCategoryByID = async (categoryId: string) => {
//   const category = await Category.findById(categoryId).lean();

//   if (!category) {
//     throw new AppError("Category not found", 404);
//   }

//   return category;
// };

// export const updateCategory = async (
//   categoryId: string,
//   data: UpdateCategoryProps,
// ) => {
//   // Check duplicate name only when name is being updated
//   if (data.name) {
//     const existingCategory = await Category.findOne({
//       name: data.name,
//       _id: { $ne: categoryId },
//     });

//     if (existingCategory) {
//       throw new AppError("Category name already exists", 409);
//     }
//   }

//   const category = await Category.findByIdAndUpdate(categoryId, data, {
//     returnDocument: "after",
//     runValidators: true,
//   }).lean();

//   if (!category) {
//     throw new AppError("Category not found", 404);
//   }

//   return category;
// };

// export const deleteCategory = async (categoryId: string) => {
//   const category = await Category.findOneAndUpdate(
//     {
//       _id: categoryId,
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

//   if (!category) {
//     throw new AppError("Category not found", 404);
//   }

//   return category;
// };
import { Category } from "../../models/categories/models/category.model";
import { AppError } from "../../utils/AppError";

interface CreateCategoryProps {
  name: string;
  description: string;
  isActive?: boolean;
}

interface UpdateCategoryProps {
  name?: string;
  description?: string;
  isActive?: boolean;
}

interface GetCategoriesQuery {
  page?: number;
  limit?: number;
}

export const createCategory = async (
  data: CreateCategoryProps,
) => {
  try {
    return await Category.create(data);
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(
        "Category name already exists",
        409,
      );
    }

    throw error;
  }
};

export const getCategories = async (
  query: GetCategoriesQuery = {},
) => {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(
    Math.max(query.limit ?? 10, 1),
    100,
  );

  const skip = (page - 1) * limit;

  const [categories, totalCategories] =
    await Promise.all([
      Category.find()
        .select(
          "name description isActive createdAt",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Category.countDocuments(),
    ]);

  return {
    categories,
    pagination: {
      page,
      limit,
      totalCategories,
      totalPages: Math.ceil(
        totalCategories / limit,
      ),
    },
  };
};

export const getCategoryById = async (
  categoryId: string,
) => {
  const category = await Category.findById(
    categoryId,
  )
    .select(
      "name description isActive createdAt updatedAt",
    )
    .lean();

  if (!category) {
    throw new AppError(
      "Category not found",
      404,
    );
  }

  return category;
};

export const updateCategory = async (
  categoryId: string,
  data: UpdateCategoryProps,
) => {
  try {
    const category =
      await Category.findByIdAndUpdate(
        categoryId,
        { $set: data },
        {
          new: true,
          runValidators: true,
        },
      ).lean();

    if (!category) {
      throw new AppError(
        "Category not found",
        404,
      );
    }

    return category;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(
        "Category name already exists",
        409,
      );
    }

    throw error;
  }
};

export const deleteCategory = async (
  categoryId: string,
) => {
  const category =
    await Category.findOneAndUpdate(
      {
        _id: categoryId,
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

  if (!category) {
    throw new AppError(
      "Category not found",
      404,
    );
  }

  return category;
};