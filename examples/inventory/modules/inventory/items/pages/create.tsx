/**
 * Add an item, against `/api/v1/inventory/items/`.
 *
 * The branch is not asked for: a new item is filed at the user's own
 * branch, and only somebody holding the unscoped create rung could file
 * it elsewhere. `quantity` here is opening stock — the one time it is
 * typed rather than moved.
 */

import { ApiError } from "@/lib/api-client";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ControlPanel,
  FormShell,
  FormStickyHeader,
  PageActions,
  useToast,
} from "@erp/ui";
import { useInventoryNavbar } from "../../useInventoryNavbar";
import { can } from "../../shared";
import { useCategoriesQuery } from "../../categories";
import { useCreateItemMutation } from "../queries";
import { ItemForm } from "../components/ItemForm";
import { EMPTY_ITEM, itemFormSchema, type ItemFormValues } from "../../items/schema";

export default function ItemCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const navbar = useInventoryNavbar("items");
  const createMutation = useCreateItemMutation();
  const canCreate = can(session?.permissions, "inventory.item", "create");

  useEffect(() => {
    if (session && !canCreate) {
      navigate("/inventory/items", { replace: true });
    }
  }, [session, canCreate, navigate]);

  // One page of categories feeds the picker; the Dropdown filters what it
  // was given.
  const categoriesQuery = useCategoriesQuery({
    ordering: "name",
    pageSize: 100,
    filters: { is_archived: "false" },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: EMPTY_ITEM,
  });

  async function onSubmit(values: ItemFormValues) {
    try {
      const item = await createMutation.mutateAsync({
        name: values.name,
        sku: values.sku,
        barcode: values.barcode,
        description: values.description,
        unit: values.unit,
        cost_price: values.cost_price,
        sale_price: values.sale_price,
        quantity: values.quantity,
        reorder_level: values.reorder_level,
        is_tracked: values.is_tracked,
        category_uuid: values.category_uuid,
      });
      toast({
        title: "Item created",
        description: `${item.name} was added.`,
        variant: "success",
      });
      navigate("/inventory/items");
    } catch (error) {
      // The API owns the rules the form cannot know, such as a SKU
      // already taken by somebody else's record.
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (field in itemFormSchema.shape) {
            setError(field as keyof ItemFormValues, { message: messages[0] });
          }
        }
      }
      toast({
        title: "Could not create the item",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  if (session && !canCreate) {
    return null;
  }

  return (
    <AppShell activeNavKey="inventory" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={
            <PageActions
              breadcrumb="New Item"
              buttons={[
                {
                  key: "create",
                  children: "Confirm",
                  variant: "primary",
                  size: "sm",
                  loading: createMutation.isPending,
                  onClick: handleSubmit(onSubmit),
                },
                {
                  key: "cancel",
                  children: "Cancel",
                  variant: "secondary",
                  size: "sm",
                  disabled: createMutation.isPending,
                  onClick: () => navigate("/inventory/items"),
                },
              ]}
            />
          }
        />
      </FormStickyHeader>

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        <ItemForm
          mode="create"
          register={register}
          errors={errors}
          categoryUuid={watch("category_uuid")}
          onCategoryChange={(value) =>
            setValue("category_uuid", value, { shouldDirty: true })
          }
          categories={categoriesQuery.data?.data ?? []}
          categoriesLoading={categoriesQuery.isLoading}
          categoriesError={categoriesQuery.isError}
        />
      </FormShell>
    </AppShell>
  );
}
