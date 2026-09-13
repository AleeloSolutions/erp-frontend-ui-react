/**
 * Add a category, against `/api/v1/inventory/categories/`.
 */

import { api, app } from "@kaabe/runtime";
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
import { useCreateCategoryMutation } from "../queries";
import { CategoryForm } from "../components/CategoryForm";
import {
  EMPTY_CATEGORY,
  categoryFormSchema,
  type CategoryFormValues,
} from "../../categories/schema";

export default function CategoryCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = app.useSession();
  const navbar = useInventoryNavbar("categories");
  const createMutation = useCreateCategoryMutation();
  const canCreate = can(session?.permissions, "inventory.category", "create");

  useEffect(() => {
    if (session && !canCreate) {
      navigate("/inventory/categories", { replace: true });
    }
  }, [session, canCreate, navigate]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY_CATEGORY,
  });

  async function onSubmit(values: CategoryFormValues) {
    try {
      const category = await createMutation.mutateAsync(values);
      toast({
        title: "Category created",
        description: `${category.name} was added.`,
        variant: "success",
      });
      navigate("/inventory/categories");
    } catch (error) {
      // The API owns the rules the form cannot know, such as a name
      // already taken by somebody else's record.
      if (error instanceof api.ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (field in categoryFormSchema.shape) {
            setError(field as keyof CategoryFormValues, { message: messages[0] });
          }
        }
      }
      toast({
        title: "Could not create the category",
        description: error instanceof api.ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  if (session && !canCreate) {
    return null;
  }

  return (
    <app.AppShell activeNavKey="inventory" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={
            <PageActions
              breadcrumb="New Category"
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
                  onClick: () => navigate("/inventory/categories"),
                },
              ]}
            />
          }
        />
      </FormStickyHeader>

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        <CategoryForm register={register} errors={errors} />
      </FormShell>
    </app.AppShell>
  );
}
