import { z } from "zod";

export const movementFormSchema = z.object({
  item_uuid: z.string().uuid("Pick an item"),
  movement_type: z.enum(["in", "out", "adjust"]),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: "Quantity must be zero or greater",
    }),
  note: z.string().max(255),
});

export type MovementFormValues = z.infer<typeof movementFormSchema>;

export const EMPTY_MOVEMENT: MovementFormValues = {
  item_uuid: "",
  movement_type: "in",
  quantity: "1",
  note: "",
};

export const MOVEMENT_TYPE_LABELS: Record<MovementFormValues["movement_type"], string> = {
  in: "Stock in",
  out: "Stock out",
  adjust: "Adjustment",
};
