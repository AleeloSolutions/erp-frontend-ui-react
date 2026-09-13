/**
 * Record a stock movement, against `/api/v1/inventory/movements/`.
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
import { useItemsQuery } from "../../items/queries";
import { useCreateMovementMutation } from "../queries";
import { MovementForm } from "../components/MovementForm";
import { EMPTY_MOVEMENT, movementFormSchema, type MovementFormValues } from "../schema";

export default function MovementCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const navbar = useInventoryNavbar("movements");
  const createMutation = useCreateMovementMutation();
  const canCreate = can(session?.permissions, "inventory.movement", "create");

  const itemsQuery = useItemsQuery({
    ordering: "name",
    pageSize: 100,
    filters: { is_archived: "false" },
  });

  useEffect(() => {
    if (session && !canCreate) {
      navigate("/inventory/movements", { replace: true });
    }
  }, [session, canCreate, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: EMPTY_MOVEMENT,
  });

  async function onSubmit(values: MovementFormValues) {
    try {
      await createMutation.mutateAsync({
        item_uuid: values.item_uuid,
        movement_type: values.movement_type,
        quantity: values.quantity,
        note: values.note,
      });
      toast({
        title: "Movement recorded",
        description: "Stock on hand was updated.",
        variant: "success",
      });
      navigate("/inventory/movements");
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (field in movementFormSchema.shape) {
            setError(field as keyof MovementFormValues, { message: messages[0] });
          }
        }
      }
      toast({
        title: "Could not record the movement",
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
              breadcrumb="New Movement"
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
                  onClick: () => navigate("/inventory/movements"),
                },
              ]}
            />
          }
        />
      </FormStickyHeader>

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        <MovementForm
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          items={itemsQuery.data?.data ?? []}
        />
      </FormShell>
    </AppShell>
  );
}
