/**
 * Edit a customer, against `/api/v1/sales/customers/<uuid>/`.
 *
 * Archiving lives here rather than on the list: a customer with invoices
 * can never be deleted, so archiving is the real end of their life and
 * belongs where the record is, not behind a row menu.
 */

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
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
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import { can } from "@/modules/sales/shared";
import { useCustomerQuery, useUpdateCustomerMutation } from "../queries";
import { CustomerForm } from "../components/CustomerForm";
import {
  EMPTY_CUSTOMER,
  customerFormSchema,
  type CustomerFormValues,
} from "@/modules/sales/customers/schema";
import { ApiError } from "@/lib/api-client";

const LIFECYCLE: StatusStep[] = [
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
];

export default function CustomerEditPage() {
  const { uuid = "" } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const navbar = useSalesNavbar("customers");
  const canEdit = can(session?.permissions, "sales.customer", "edit");

  const customerQuery = useCustomerQuery(uuid);
  const updateMutation = useUpdateCustomerMutation();
  const customer = customerQuery.data;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: EMPTY_CUSTOMER,
  });

  // Re-seed once the record arrives; until then the form holds its defaults.
  useEffect(() => {
    if (!customer) return;
    reset({
      name: customer.name,
      customer_type: customer.customer_type,
      email: customer.email,
      phone: customer.phone,
      mobile: customer.mobile,
      tax_number: customer.tax_number,
      currency: customer.currency,
      payment_terms_days: customer.payment_terms_days,
      address_line1: customer.address_line1,
      address_line2: customer.address_line2,
      city: customer.city,
      state: customer.state,
      postal_code: customer.postal_code,
      country: customer.country,
      notes: customer.notes,
    });
  }, [customer, reset]);

  function report(error: unknown, fallback: string) {
    if (error instanceof ApiError && error.fields) {
      for (const [field, messages] of Object.entries(error.fields)) {
        setError(field as keyof CustomerFormValues, { message: messages[0] });
      }
    }
    toast({
      title: fallback,
      description: error instanceof ApiError ? error.message : "Please try again.",
      variant: "error",
    });
  }

  async function onSubmit(values: CustomerFormValues) {
    try {
      await updateMutation.mutateAsync({
        uuid,
        input: {
          ...values,
          currency: values.currency.toUpperCase(),
          country: values.country.toUpperCase(),
        },
      });
      toast({ title: "Customer saved", variant: "success" });
      navigate("/sales/customers");
    } catch (error) {
      report(error, "Could not save the customer");
    }
  }

  async function setArchived(isArchived: boolean) {
    try {
      await updateMutation.mutateAsync({ uuid, input: { is_archived: isArchived } });
      toast({
        title: isArchived ? "Customer archived" : "Customer restored",
        variant: "success",
      });
    } catch (error) {
      report(error, "Could not update the customer");
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
          onClick: () => navigate("/sales/customers"),
        },
      ]
    : [
        {
          key: "back",
          label: "Back",
          variant: "secondary",
          onClick: () => navigate("/sales/customers"),
        },
      ];

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={<PageActions breadcrumb={customer?.name || "Customer"} />}
        />

        <FormStatusBar
          sticky={false}
          steps={LIFECYCLE}
          currentStepKey={customer?.is_archived ? "archived" : "active"}
          onStepChange={
            canEdit ? (key) => void setArchived(key === "archived") : undefined
          }
          actions={actions}
        />
      </FormStickyHeader>

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        {customerQuery.isError ? (
          <p className="m-0 px-4 py-6 text-[12px] text-erp-muted">
            This customer could not be loaded.
          </p>
        ) : (
          <CustomerForm
            register={register}
            errors={errors}
            customerType={watch("customer_type")}
            onCustomerTypeChange={(value) =>
              setValue("customer_type", value, { shouldDirty: true })
            }
            readOnly={!canEdit}
          />
        )}
      </FormShell>
    </AppShell>
  );
}
