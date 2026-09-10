import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Boxes } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  useToast,
} from "@erp/ui";
import { api, app } from "@kaabe/runtime";
import { ITEMS_QUERY_KEY, createItem } from "../api";

export default function ItemCreatePage() {
  const navbar = app.useNavbarDefaults({ brandLabel: "Inventory" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const create = useMutation({
    mutationFn: createItem,
    onSuccess: (item) => {
      toast({ title: "Item saved", description: item.title, variant: "success" });
      void queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      navigate("/inventory/items");
    },
    onError: (error: unknown) => {
      if (error instanceof api.ApiError && error.fields) setFieldErrors(error.fields);
      toast({
        title: "Could not save",
        description: error instanceof api.ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    },
  });

  return (
    <app.AppShell activeNavKey="inventory" navbar={navbar}>
      <PageHeader
        module="Inventory"
        section="Items"
        title="New item"
        icon={<Boxes className="h-4 w-4" aria-hidden />}
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Add stock item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[12px]">
          <label className="block">
            <span className="mb-1 block text-erp-muted">Title</span>
            <Input
              className="w-full"
              value={title}
              error={Boolean(fieldErrors.title)}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Widget A"
            />
            {fieldErrors.title ? (
              <span className="text-erp-error">{fieldErrors.title[0]}</span>
            ) : null}
          </label>
          <label className="block">
            <span className="mb-1 block text-erp-muted">SKU</span>
            <Input
              className="w-full"
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="Optional"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-erp-muted">Quantity</span>
            <Input
              className="w-40"
              value={quantity}
              inputMode="decimal"
              error={Boolean(fieldErrors.quantity)}
              onChange={(event) => setQuantity(event.target.value)}
            />
            {fieldErrors.quantity ? (
              <span className="text-erp-error">{fieldErrors.quantity[0]}</span>
            ) : null}
          </label>
          <div className="flex gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              loading={create.isPending}
              disabled={!title.trim()}
              onClick={() => {
                setFieldErrors({});
                create.mutate({
                  title: title.trim(),
                  sku: sku.trim(),
                  quantity: quantity.trim() || "0",
                });
              }}
            >
              Save
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/inventory/items")}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </app.AppShell>
  );
}
