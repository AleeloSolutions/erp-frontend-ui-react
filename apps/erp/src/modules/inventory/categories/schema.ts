import { z } from "zod";

/**
 * The category form.
 *
 * A category is a name and nothing else; only shape is checked here, and
 * whether the name is already taken is the API's answer to give.
 */
export const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const EMPTY_CATEGORY: CategoryFormValues = {
  name: "",
};
