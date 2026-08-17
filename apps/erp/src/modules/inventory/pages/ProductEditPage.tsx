import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package } from "lucide-react";
import { AppShell, PageHeader, PageSubmenu } from "@/app";
import {
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormSelect,
  FormShell,
  FormTextarea,
  useToast,
} from "@erp/ui";
import { inventorySubmenu } from "@/modules/inventory/manifest";
import { useProductQuery, useUpdateProductMutation } from "@/modules/inventory/api";
import {
  productCategoryOptions,
  productFormSchema,
  productStatusOptions,
  productUnitOptions,
  type ProductFormValues,
} from "@/modules/inventory/products/schema";
import { MockApiError } from "@/lib/mock";

export default function ProductEditPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const productQuery = useProductQuery(id);
  const updateMutation = useUpdateProductMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      sku: "",
      name: "",
      category: "Office",
      unit: "ea",
      unitPrice: "",
      costPrice: "0",
      stockQty: "0",
      reorderLevel: "0",
      status: "Active",
      barcode: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!productQuery.data) return;
    const product = productQuery.data;
    reset({
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
      unitPrice: String(product.unitPrice),
      costPrice: String(product.costPrice),
      stockQty: String(product.stockQty),
      reorderLevel: String(product.reorderLevel),
      status: product.status,
      barcode: product.barcode ?? "",
      description: product.description ?? "",
    });
  }, [productQuery.data, reset]);

  async function onSubmit(values: ProductFormValues) {
    try {
      const product = await updateMutation.mutateAsync({
        id,
        input: {
          sku: values.sku,
          name: values.name,
          category: values.category,
          unit: values.unit,
          unitPrice: Number(values.unitPrice),
          costPrice: Number(values.costPrice),
          stockQty: Number(values.stockQty),
          reorderLevel: Number(values.reorderLevel),
          status: values.status,
          barcode: values.barcode,
          description: values.description,
        },
      });
      toast({
        title: "Product updated",
        description: `${product.name} (${product.sku}) was saved.`,
        variant: "success",
      });
      navigate("/inventory/products");
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not update product.";
      toast({ title: "Update failed", description: message, variant: "error" });
    }
  }

  const loading = productQuery.isLoading || productQuery.isFetching;
  const notFound = productQuery.isError;

  return (
    <AppShell activeNavKey="inventory" activeMobileKey="create">
      <PageHeader
        module="Inventory"
        section="Products"
        title="Edit Product"
        description="Update catalog details, pricing, and stock levels."
        icon={<Package className="h-4 w-4" aria-hidden />}
      />

      <PageSubmenu module="Inventory" items={inventorySubmenu} activeKey="products" />

      {notFound ? (
        <div className="rounded-[10px] border border-erp-border bg-erp-surface p-4 text-[12px] text-erp-muted">
          <p className="m-0 font-bold text-erp-text">Product not found</p>
          <p className="mt-1 mb-0">
            The product may have been deleted.{" "}
            <button
              type="button"
              className="font-bold text-erp-blue hover:underline"
              onClick={() => navigate("/inventory/products")}
            >
              Back to products
            </button>
          </p>
        </div>
      ) : (
        <FormShell
          title={productQuery.data?.name ?? "Edit product"}
          description={
            loading
              ? "Loading product…"
              : 'Required fields are marked. Use a SKU or name containing "fail" to simulate a server error.'
          }
          onSubmit={handleSubmit(onSubmit)}
          actionProps={{
            submitLabel: "Save changes",
            submitting: updateMutation.isPending || loading,
            onCancel: () => navigate("/inventory/products"),
          }}
        >
          <FormSection title="Identity">
            <FormGrid columns={12}>
              <FormField
                label="SKU"
                required
                htmlFor="product-sku"
                error={errors.sku?.message}
                span={4}
              >
                <FormInput
                  id="product-sku"
                  error={Boolean(errors.sku)}
                  disabled={loading}
                  {...register("sku")}
                />
              </FormField>
              <FormField
                label="Product name"
                required
                htmlFor="product-name"
                error={errors.name?.message}
                span={8}
              >
                <FormInput
                  id="product-name"
                  error={Boolean(errors.name)}
                  disabled={loading}
                  {...register("name")}
                />
              </FormField>
              <FormField
                label="Category"
                required
                htmlFor="product-category"
                error={errors.category?.message}
                span={4}
              >
                <FormSelect
                  id="product-category"
                  error={Boolean(errors.category)}
                  options={[...productCategoryOptions]}
                  disabled={loading}
                  {...register("category")}
                />
              </FormField>
              <FormField
                label="Unit"
                required
                htmlFor="product-unit"
                error={errors.unit?.message}
                span={4}
              >
                <FormSelect
                  id="product-unit"
                  error={Boolean(errors.unit)}
                  options={[...productUnitOptions]}
                  disabled={loading}
                  {...register("unit")}
                />
              </FormField>
              <FormField
                label="Status"
                required
                htmlFor="product-status"
                error={errors.status?.message}
                span={4}
              >
                <FormSelect
                  id="product-status"
                  error={Boolean(errors.status)}
                  options={[...productStatusOptions]}
                  disabled={loading}
                  {...register("status")}
                />
              </FormField>
              <FormField
                label="Barcode"
                htmlFor="product-barcode"
                error={errors.barcode?.message}
                span={12}
              >
                <FormInput
                  id="product-barcode"
                  error={Boolean(errors.barcode)}
                  disabled={loading}
                  {...register("barcode")}
                />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Pricing & stock">
            <FormGrid columns={12}>
              <FormField
                label="Unit price"
                required
                htmlFor="product-unit-price"
                error={errors.unitPrice?.message}
                span={3}
              >
                <FormInput
                  id="product-unit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  error={Boolean(errors.unitPrice)}
                  disabled={loading}
                  {...register("unitPrice")}
                />
              </FormField>
              <FormField
                label="Cost price"
                required
                htmlFor="product-cost-price"
                error={errors.costPrice?.message}
                span={3}
              >
                <FormInput
                  id="product-cost-price"
                  type="number"
                  step="0.01"
                  min="0"
                  error={Boolean(errors.costPrice)}
                  disabled={loading}
                  {...register("costPrice")}
                />
              </FormField>
              <FormField
                label="Stock quantity"
                required
                htmlFor="product-stock"
                error={errors.stockQty?.message}
                span={3}
              >
                <FormInput
                  id="product-stock"
                  type="number"
                  step="1"
                  min="0"
                  error={Boolean(errors.stockQty)}
                  disabled={loading}
                  {...register("stockQty")}
                />
              </FormField>
              <FormField
                label="Reorder level"
                required
                htmlFor="product-reorder"
                error={errors.reorderLevel?.message}
                span={3}
              >
                <FormInput
                  id="product-reorder"
                  type="number"
                  step="1"
                  min="0"
                  error={Boolean(errors.reorderLevel)}
                  disabled={loading}
                  {...register("reorderLevel")}
                />
              </FormField>
              <FormField
                label="Description"
                htmlFor="product-description"
                error={errors.description?.message}
                span={12}
              >
                <FormTextarea
                  id="product-description"
                  error={Boolean(errors.description)}
                  disabled={loading}
                  {...register("description")}
                />
              </FormField>
            </FormGrid>
          </FormSection>
        </FormShell>
      )}
    </AppShell>
  );
}
