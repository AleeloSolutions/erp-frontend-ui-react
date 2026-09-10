/**
 * Add a customer, against `/api/v1/sales/customers/`.
 *
 * The branch is not asked for: a new customer is filed at the user's own
 * branch, and only somebody holding the unscoped create rung could file
 * it elsewhere. That is a rare enough case to leave to the edit form.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
import {
  ControlPanel,
  FormShell,
  FormStickyHeader,
  PageActions,
  useToast,
} from "@erp/ui";
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import { can } from "@/modules/sales/shared";
import { useCreateCustomerMutation } from "../queries";
import { CustomerForm } from "../components/CustomerForm";
import {
  EMPTY_CUSTOMER,
  customerFormSchema,
  type CustomerFormValues,
} from "@/modules/sales/customers/schema";
import { ApiError } from "@/lib/api-client";

export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const navbar = useSalesNavbar("customers");
  const createMutation = useCreateCustomerMutation();
  const canCreate = can(session?.permissions, "sales.customer", "create");

  useEffect(() => {
    if (session && !canCreate) {
      navigate("/sales/customers", { replace: true });
    }
  }, [session, canCreate, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: EMPTY_CUSTOMER,
  });

  async function onSubmit(values: CustomerFormValues) {
    try {
      const customer = await createMutation.mutateAsync({
        ...values,
        currency: values.currency.toUpperCase(),
        country: values.country.toUpperCase(),
      });
      toast({
        title: "Customer created",
        description: `${customer.name} was added.`,
        variant: "success",
      });
      navigate("/sales/customers");
    } catch (error) {
      // The API owns the rules the form cannot know, such as a name
      // already taken by somebody else's record.
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          setError(field as keyof CustomerFormValues, { message: messages[0] });
        }
      }
      toast({
        title: "Could not create the customer",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  if (session && !canCreate) {
    return null;
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={
            <PageActions
              breadcrumb="New Customer"
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
                  onClick: () => navigate("/sales/customers"),
                },
              ]}
            />
          }
        />
      </FormStickyHeader>

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        <CustomerForm
          register={register}
          errors={errors}
          customerType={watch("customer_type")}
          onCustomerTypeChange={(value) =>
            setValue("customer_type", value, { shouldDirty: true })
          }
        />
      </FormShell>
    </AppShell>
  );
}
