/**
 * Edit a product — the catalogue record behind a sale line.
 *
 * The body is `productFields` rendered by `RecordFormFields`, the same schema
 * the sale line's quick-create modal uses, so editing a product shows exactly
 * what creating one asks for. The page keeps what is business: the query, the
 * resolver, the save and the lifecycle bar.
 */

import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ControlPanel,
  FormShell,
  FormStatusBar,
  FormStickyHeader,
  PageActions,
  RecordFormFields,
  useToast,
  type FieldOption,
  type StatusStep,
} from "@erp/ui";
import { AppShell } from "@/app";
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import { useTaxesQuery } from "@/modules/sales/shared";
import { rhfAdapter } from "@/lib/form-adapter";
import { useProductQuery, useUpdateProductMutation } from "../queries";
import { productFields } from "../fields";
import {
  EMPTY_PRODUCT,
  productFormSchema,
  toProductFormValues,
  toProductInput,
  type ProductFormValues,
} from "../schema";
import { ApiError } from "@/lib/api-client";

const STATUS_STEPS: StatusStep[] = [
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
];

export default function ProductEditPage() {
  const { uuid = "" } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useSalesNavbar("products");
  const productQuery = useProductQuery(uuid);
  const updateMutation = useUpdateProductMutation();
  const taxesQuery = useTaxesQuery();
  const product = productQuery.data;

  // The schema's `default_tax` select reads this through `optionsKey: "taxes"`.
  // An archived tax is no longer a choice, and the empty option leads because
  // a `<select>` has no null — "" is what the form stores for "no tax".
  const taxOptions = useMemo<FieldOption[]>(
    () => [
      { value: "", label: "No tax" },
      ...(taxesQuery.data?.data ?? [])
        .filter((tax) => !tax.is_archived)
        .map((tax) => ({ value: tax.uuid, label: `${tax.name} (${tax.rate}%)` })),
    ],
    [taxesQuery.data]
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: EMPTY_PRODUCT,
  });

  // Re-seed once the record arrives; until then the form holds its defaults.
  useEffect(() => {
    if (!product) return;
    reset(toProductFormValues(product));
  }, [product, reset]);

  async function onSubmit(values: ProductFormValues) {
    try {
      await updateMutation.mutateAsync({ uuid, input: toProductInput(values) });
      toast({ title: "Product saved", variant: "success" });
      navigate("/sales/products");
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          setError(field as keyof ProductFormValues, { message: messages[0] });
        }
      }
      toast({
        title: "Could not save the product",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="more" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={<PageActions breadcrumb={product?.name || "Product"} />}
        />
        <FormStatusBar
          sticky={false}
          steps={STATUS_STEPS}
          currentStepKey={product?.is_archived ? "archived" : "active"}
          actions={[
            {
              key: "save",
              label: "Save",
              variant: "primary",
              loading: updateMutation.isPending,
              onClick: handleSubmit(onSubmit),
            },
            {
              key: "back",
              label: "Back",
              variant: "secondary",
              onClick: () => navigate("/sales/products"),
            },
          ]}
        />
      </FormStickyHeader>

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        {productQuery.isError ? (
          <p className="m-0 px-4 py-6 text-[12px] text-erp-muted">
            This product could not be loaded.
          </p>
        ) : (
          <RecordFormFields
            fields={productFields}
            adapter={rhfAdapter(register, errors)}
            options={{ taxes: taxOptions }}
          />
        )}
      </FormShell>
    </AppShell>
  );
}
