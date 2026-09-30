import { z } from "zod";

import { categorySchema } from "./category.schema";

export const updateCategorySchema =
  categorySchema.partial();

export type UpdateCategoryDataForm = z.infer<
  typeof updateCategorySchema
>;