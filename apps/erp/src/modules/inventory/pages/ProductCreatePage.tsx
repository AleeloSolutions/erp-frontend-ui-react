import { useNavigate } from "react-router-dom";
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
import { useCreateProductMutation } from "@/modules/inventory/api";
import {
  productCategoryOptions,
  productFormSchema,
  productStatusOptions,
  productUnitOptions,
  type ProductFormValues,
} from "@/modules/inventory/products/schema";
import { MockApiError } from "@/lib/mock";

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMutation = useCreateProductMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      sku: "",
      name: "",
      category: "Office",
      unit: "ea",
      unitPrice: "",
      costPrice: "",
      stockQty: "",
      reorderLevel: "",
      status: "Active",
      barcode: "",
      description: "",
    },
  });

  async function onSubmit(values: ProductFormValues) {
    try {
      const product = await createMutation.mutateAsync({
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
      });
      toast({
        title: "Product created",
        description: `${product.name} (${product.sku}) was added successfully.`,
        variant: "success",
      });
      navigate("/inventory/products");
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not create product.";
      toast({ title: "Create failed", description: message, variant: "error" });
    }
  }

  return (
    <AppShell activeNavKey="inventory" activeMobileKey="tasks">
      <PageHeader
        module="Inventory"
        section="Products"
        title="Create Product"
        description="Add a catalog item with pricing, stock, and status."
        icon={<Package className="h-4 w-4" aria-hidden />}
      />

      <PageSubmenu module="Inventory" items={inventorySubmenu} activeKey="products" />

      <FormShell
        title="New product"
        description='Required fields are marked. Use a SKU or name containing "fail" to simulate a server error.'
        onSubmit={handleSubmit(onSubmit)}
        actionProps={{
          submitLabel: "Create product",
          submitting: createMutation.isPending,
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
                placeholder="PRD-2001"
                error={Boolean(errors.sku)}
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
                {...register("description")}
              />
            </FormField>
          </FormGrid>
        </FormSection>
      </FormShell>
    </AppShell>
  );
}
