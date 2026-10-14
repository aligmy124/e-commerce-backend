import z from "zod";

export const reviewSchema = z.object({
    rating: z.number({
        error:"rating is required"
    })
    .min(1, "Rating cannot be less than 1")
    .max(5, "Rating cannot be more than 5"),
    comment: z.string({
        error: "comment is required"
    })
    .trim()
    .min(4, "Comment must be at least 4 characters")
    .max(500, "Comment must be at most 500 characters")
}).strict();

export type reviewFormData = z.infer<typeof reviewSchema>;