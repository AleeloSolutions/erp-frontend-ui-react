/**
 * Edit a category, against `/api/v1/inventory/categories/<uuid>/`.
 *
 * Archiving lives here rather than on the list: a category still holding
 * items can never be deleted, so archiving is the real end of its life and
 * belongs where the record is, not behind a row menu.
 */

import { api, app } from "@kaabe/runtime";
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
import { useCategoryQuery, useUpdateCategoryMutation } from "../queries";
import { CategoryForm } from "../components/CategoryForm";
import {
  EMPTY_CATEGORY,
  categoryFormSchema,
  type CategoryFormValues,
} from "../../categories/schema";

const LIFECYCLE: StatusStep[] = [
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
];

export default function CategoryEditPage() {
  const { uuid = "" } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = app.useSession();
  const navbar = useInventoryNavbar("categories");
  const canEdit = can(session?.permissions, "inventory.category", "edit");

  const categoryQuery = useCategoryQuery(uuid);
  const updateMutation = useUpdateCategoryMutation();
  const category = categoryQuery.data;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY_CATEGORY,
  });

  // Re-seed once the record arrives; until then the form holds its defaults.
  useEffect(() => {
    if (!category) return;
    reset({ name: category.name });
  }, [category, reset]);

  function report(error: unknown, fallback: string) {
    if (error instanceof api.ApiError && error.fields) {
      for (const [field, messages] of Object.entries(error.fields)) {
        if (field in categoryFormSchema.shape) {
          setError(field as keyof CategoryFormValues, { message: messages[0] });
        }
      }
    }
    toast({
      title: fallback,
      description: error instanceof api.ApiError ? error.message : "Please try again.",
      variant: "error",
    });
  }

  async function onSubmit(values: CategoryFormValues) {
    try {
      await updateMutation.mutateAsync({ uuid, input: values });
      toast({ title: "Category saved", variant: "success" });
      navigate("/inventory/categories");
    } catch (error) {
      report(error, "Could not save the category");
    }
  }

  async function setArchived(isArchived: boolean) {
    try {
      await updateMutation.mutateAsync({ uuid, input: { is_archived: isArchived } });
      toast({
        title: isArchived ? "Category archived" : "Category restored",
        variant: "success",
      });
    } catch (error) {
      report(error, "Could not update the category");
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
          onClick: () => navigate("/inventory/categories"),
        },
      ]
    : [
        {
          key: "back",
          label: "Back",
          variant: "secondary",
          onClick: () => navigate("/inventory/categories"),
        },
      ];

  return (
    <app.AppShell activeNavKey="inventory" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={<PageActions breadcrumb={category?.name || "Category"} />}
        />

        <FormStatusBar
          sticky={false}
          steps={LIFECYCLE}
          currentStepKey={category?.is_archived ? "archived" : "active"}
          onStepChange={
            canEdit ? (key) => void setArchived(key === "archived") : undefined
          }
          actions={actions}
        />
      </FormStickyHeader>

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        {categoryQuery.isError ? (
          <p className="m-0 px-4 py-6 text-[12px] text-erp-muted">
            This category could not be loaded.
          </p>
        ) : (
          <CategoryForm register={register} errors={errors} readOnly={!canEdit} />
        )}
      </FormShell>
    </app.AppShell>
  );
}
