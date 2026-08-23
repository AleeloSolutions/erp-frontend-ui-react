import { z } from "zod";

export const contractFormSchema = z.object({
  name: z.string().min(1, "Contract name is required"),
  customer: z.string().min(1, "Customer is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["Active", "Draft", "Expired"], {
    message: "Status is required",
  }),
  value: z
    .string()
    .min(1, "Value is required")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: "Value must be a positive number",
    }),
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;
