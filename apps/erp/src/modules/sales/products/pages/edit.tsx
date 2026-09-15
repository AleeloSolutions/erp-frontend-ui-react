/**
 * Edit a product — MVP fields.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ControlPanel,
  FormField,
  FormInput,
  FormStatusBar,
  FormStickyHeader,
  PageActions,
  PageContainer,
  useToast,
  type StatusStep,
} from "@erp/ui";
import { AppShell } from "@/app";
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import { useProductQuery, useUpdateProductMutation } from "../queries";
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

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [unitPrice, setUnitPrice] = useState("0.00");

  useEffect(() => {
    const product = productQuery.data;
    if (!product) return;
    setName(product.name);
    setCode(product.code);
    setUnitPrice(product.unit_price);
  }, [productQuery.data]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Product name is required" });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        uuid,
        input: { name: trimmed, code: code.trim(), unit_price: unitPrice || "0.00" },
      });
      toast({ title: "Product saved", variant: "success" });
      navigate("/sales/products");
    } catch (err) {
      toast({
        title: "Could not save the product",
        description: err instanceof ApiError ? err.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="more" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={<PageActions breadcrumb={productQuery.data?.name || "Product"} />}
        />
        <FormStatusBar
          sticky={false}
          steps={STATUS_STEPS}
          currentStepKey={productQuery.data?.is_archived ? "archived" : "active"}
          actions={[
            {
              key: "save",
              label: "Save",
              variant: "primary",
              loading: updateMutation.isPending,
              onClick: () => void handleSave(),
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

      <PageContainer>
        <div className="mx-4 mt-4 max-w-xl space-y-4 rounded-sm border border-erp-border bg-white p-6">
          <FormField label="Name" htmlFor="product-name" required>
            <FormInput
              id="product-name"
              chrome="underline"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </FormField>
          <FormField label="Code" htmlFor="product-code">
            <FormInput
              id="product-code"
              chrome="underline"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </FormField>
          <FormField label="Unit price" htmlFor="product-price">
            <FormInput
              id="product-price"
              chrome="underline"
              inputMode="decimal"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
            />
          </FormField>
        </div>
      </PageContainer>
    </AppShell>
  );
}
