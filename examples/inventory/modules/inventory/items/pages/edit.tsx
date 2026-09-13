/**
 * Edit an item, against `/api/v1/inventory/items/<uuid>/`.
 *
 * Archiving lives here rather than on the list: an item with stock
 * movements can never be deleted, so archiving is the real end of its
 * life and belongs where the record is, not behind a row menu. On-hand is
 * shown but never sent — only a movement changes it.
 */

import { ApiError } from "@/lib/api-client";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ControlPanel,
  FormShell,
  FormStatusBar,
  FormStickyHeader,
  PageActions,
  useToast,
  type FormStatusBarAction,
  type StatusStep,
} from "@erp/ui";
import { useInventoryNavbar } from "../../useInventoryNavbar";
import { can } from "../../shared";
import { useCategoriesQuery } from "../../categories";
import { useItemQuery, useUpdateItemMutation } from "../queries";
import { ItemForm } from "../components/ItemForm";
import { EMPTY_ITEM, itemFormSchema, type ItemFormValues } from "../../items/schema";

const LIFECYCLE: StatusStep[] = [
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
];

export default function ItemEditPage() {
  const { uuid = "" } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const navbar = useInventoryNavbar("items");
  const canEdit = can(session?.permissions, "inventory.item", "edit");

  const itemQuery = useItemQuery(uuid);
  const updateMutation = useUpdateItemMutation();
  const item = itemQuery.data;

  const categoriesQuery = useCategoriesQuery({
    ordering: "name",
    pageSize: 100,
    filters: { is_archived: "false" },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: EMPTY_ITEM,
  });

  // Re-seed once the record arrives; until then the form holds its defaults.
  useEffect(() => {
    if (!item) return;
    reset({
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      description: item.description,
      unit: item.unit,
      cost_price: item.cost_price,
      sale_price: item.sale_price,
      quantity: item.quantity,
      reorder_level: item.reorder_level,
      is_tracked: item.is_tracked,
      category_uuid: item.category?.uuid ?? "",
    });
  }, [item, reset]);

  function report(error: unknown, fallback: string) {
    if (error instanceof ApiError && error.fields) {
      for (const [field, messages] of Object.entries(error.fields)) {
        if (field in itemFormSchema.shape) {
          setError(field as keyof ItemFormValues, { message: messages[0] });
        }
      }
    }
    toast({
      title: fallback,
      description: error instanceof ApiError ? error.message : "Please try again.",
      variant: "error",
    });
  }

  async function onSubmit(values: ItemFormValues) {
    try {
      await updateMutation.mutateAsync({
        uuid,
        input: {
          name: values.name,
          sku: values.sku,
          barcode: values.barcode,
          description: values.description,
          unit: values.unit,
          cost_price: values.cost_price,
          sale_price: values.sale_price,
          reorder_level: values.reorder_level,
          is_tracked: values.is_tracked,
          category_uuid: values.category_uuid,
        },
      });
      toast({ title: "Item saved", variant: "success" });
      navigate("/inventory/items");
    } catch (error) {
      report(error, "Could not save the item");
    }
  }

  async function setArchived(isArchived: boolean) {
    try {
      await updateMutation.mutateAsync({ uuid, input: { is_archived: isArchived } });
      toast({
        title: isArchived ? "Item archived" : "Item restored",
        variant: "success",
      });
    } catch (error) {
      report(error, "Could not update the item");
    }
  }

  const actions: FormStatusBarAction[] = canEdit
    ? [
        {
          key: "save",
          label: "Save",
          variant: "primary",
          loading: updateMutation.isPending,
          onClick: handleSubmit(onSubmit),
        },
        {
          key: "cancel",
          label: "Cancel",
          variant: "secondary",
          disabled: updateMutation.isPending,
          onClick: () => navigate("/inventory/items"),
        },
      ]
    : [
        {
          key: "back",
          label: "Back",
          variant: "secondary",
          onClick: () => navigate("/inventory/items"),
        },
      ];

  return (
    <AppShell activeNavKey="inventory" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={<PageActions breadcrumb={item?.name || "Item"} />}
        />

        <FormStatusBar
          sticky={false}
          steps={LIFECYCLE}
          currentStepKey={item?.is_archived ? "archived" : "active"}
          onStepChange={
            canEdit ? (key) => void setArchived(key === "archived") : undefined
          }
          actions={actions}
        />
      </FormStickyHeader>

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        {itemQuery.isError ? (
          <p className="m-0 px-4 py-6 text-[12px] text-erp-muted">
            This item could not be loaded.
          </p>
        ) : (
          <ItemForm
            mode="edit"
            onHand={item?.quantity}
            register={register}
            errors={errors}
            categoryUuid={watch("category_uuid")}
            onCategoryChange={(value) =>
              setValue("category_uuid", value, { shouldDirty: true })
            }
            categories={categoriesQuery.data?.data ?? []}
            categoriesLoading={categoriesQuery.isLoading}
            categoriesError={categoriesQuery.isError}
            readOnly={!canEdit}
          />
        )}
      </FormShell>
    </AppShell>
  );
}
