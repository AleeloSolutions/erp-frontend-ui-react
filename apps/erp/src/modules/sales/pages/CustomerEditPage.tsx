import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell, useNavbarDefaults } from "@/app";
import {
  ControlPanel,
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormShell,
  FormStatusBar,
  FormTextarea,
  PageActions,
  Tabs,
  useToast,
  type StatusStep,
} from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useCustomerQuery, useUpdateCustomerMutation } from "@/modules/sales/api";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "@/modules/sales/customers/schema";
import { MockApiError } from "@/lib/mock";

const statusSteps: StatusStep[] = [
  { key: "Active", label: "Active" },
  { key: "Inactive", label: "Inactive" },
];

const detailTabs = [
  { key: "address", label: "Address" },
  { key: "notes", label: "Notes" },
];

export default function CustomerEditPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const customerQuery = useCustomerQuery(id);
  const updateMutation = useUpdateCustomerMutation();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "customers" });
  const [activeTab, setActiveTab] = useState("address");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      status: "Active",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!customerQuery.data) return;
    const customer = customerQuery.data;
    reset({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      address: "",
      notes: "",
    });
  }, [customerQuery.data, reset]);

  async function onSubmit(values: CustomerFormValues) {
    try {
      const customer = await updateMutation.mutateAsync({
        id,
        input: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          status: values.status,
          address: values.address,
          notes: values.notes,
        },
      });
      toast({
        title: "Customer updated",
        description: `${customer.name} was saved.`,
        variant: "success",
      });
      navigate("/sales/customers");
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not update customer.";
      toast({ title: "Update failed", description: message, variant: "error" });
    }
  }

  const loading = customerQuery.isLoading || customerQuery.isFetching;
  const notFound = customerQuery.isError;
  const status = watch("status");

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <ControlPanel
        pageActions={
          <PageActions breadcrumb={customerQuery.data?.name ?? "Edit Customer"} />
        }
      />

      {notFound ? (
        <div className="rounded-[10px] border border-erp-border bg-erp-surface p-4 text-[12px] text-erp-muted">
          <p className="m-0 font-bold text-erp-text">Customer not found</p>
          <p className="mt-1 mb-0">
            The customer may have been deleted.{" "}
            <button
              type="button"
              className="font-bold text-erp-blue hover:underline"
              onClick={() => navigate("/sales/customers")}
            >
              Back to customers
            </button>
          </p>
        </div>
      ) : (
        <>
          <FormStatusBar
            steps={statusSteps}
            currentStepKey={status}
            onStepChange={(key) =>
              setValue("status", key as CustomerFormValues["status"], {
                shouldDirty: true,
              })
            }
            actions={[
              {
                key: "save",
                label: "Confirm",
                variant: "primary",
                loading: updateMutation.isPending,
                disabled: loading,
                onClick: handleSubmit(onSubmit),
              },
              {
                key: "cancel",
                label: "Cancel",
                variant: "secondary",
                disabled: updateMutation.isPending,
                onClick: () => navigate("/sales/customers"),
              },
            ]}
          />

          <FormShell onSubmit={handleSubmit(onSubmit)}>
            <FormSection title="Basic information">
              <FormGrid columns={12}>
                <FormField
                  label="Customer name"
                  required
                  htmlFor="customer-name"
                  error={errors.name?.message}
                  span={6}
                >
                  <FormInput
                    id="customer-name"
                    error={Boolean(errors.name)}
                    disabled={loading}
                    {...register("name")}
                  />
                </FormField>
                <FormField
                  label="Email"
                  required
                  htmlFor="customer-email"
                  error={errors.email?.message}
                  span={6}
                >
                  <FormInput
                    id="customer-email"
                    type="email"
                    error={Boolean(errors.email)}
                    disabled={loading}
                    {...register("email")}
                  />
                </FormField>
                <FormField
                  label="Phone"
                  required
                  htmlFor="customer-phone"
                  error={errors.phone?.message}
                  span={6}
                >
                  <FormInput
                    id="customer-phone"
                    error={Boolean(errors.phone)}
                    disabled={loading}
                    {...register("phone")}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <div>
              <Tabs
                items={detailTabs}
                activeKey={activeTab}
                onChange={setActiveTab}
                aria-label="Customer details"
              />
              <FormSection
                title={activeTab === "address" ? "Address" : "Notes"}
                className="border-b-0"
              >
                <FormGrid columns={12}>
                  {activeTab === "address" ? (
                    <FormField
                      label="Address"
                      htmlFor="customer-address"
                      error={errors.address?.message}
                      span={12}
                    >
                      <FormInput
                        id="customer-address"
                        error={Boolean(errors.address)}
                        disabled={loading}
                        {...register("address")}
                      />
                    </FormField>
                  ) : (
                    <FormField
                      label="Notes"
                      htmlFor="customer-notes"
                      error={errors.notes?.message}
                      span={12}
                    >
                      <FormTextarea
                        id="customer-notes"
                        error={Boolean(errors.notes)}
                        disabled={loading}
                        {...register("notes")}
                      />
                    </FormField>
                  )}
                </FormGrid>
              </FormSection>
            </div>
          </FormShell>
        </>
      )}
    </AppShell>
  );
}
