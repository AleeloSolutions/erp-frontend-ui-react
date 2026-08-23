import { useNavigate } from "react-router-dom";
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
  type StatusStep,
} from "@erp/ui";
import { useToast } from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useCreateCustomerMutation } from "@/modules/sales/api";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "@/modules/sales/customers/schema";
import { MockApiError } from "@/lib/mock";

const statusSteps: StatusStep[] = [
  { key: "Active", label: "Active" },
  { key: "Inactive", label: "Inactive" },
];

export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "customers" });
  const createMutation = useCreateCustomerMutation();

  const {
    register,
    handleSubmit,
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

  async function onSubmit(values: CustomerFormValues) {
    try {
      const customer = await createMutation.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone,
        status: values.status,
        address: values.address,
        notes: values.notes,
      });
      toast({
        title: "Customer created",
        description: `${customer.name} was added successfully.`,
        variant: "success",
      });
      navigate("/sales/customers");
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not create customer.";
      toast({ title: "Create failed", description: message, variant: "error" });
    }
  }

  const status = watch("status");

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <ControlPanel pageActions={<PageActions breadcrumb="New Customer" />} />

      <FormStatusBar
        belowControlPanel
        steps={statusSteps}
        currentStepKey={status}
        onStepChange={(key) =>
          setValue("status", key as CustomerFormValues["status"], { shouldDirty: true })
        }
        actions={[
          {
            key: "create",
            label: "Confirm",
            variant: "primary",
            loading: createMutation.isPending,
            onClick: handleSubmit(onSubmit),
          },
          {
            key: "cancel",
            label: "Cancel",
            variant: "secondary",
            disabled: createMutation.isPending,
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
                chrome="tick"
                chromeEdge="end"
                id="customer-name"
                error={Boolean(errors.name)}
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
                {...register("phone")}
              />
            </FormField>
            <FormField
              label="Address"
              htmlFor="customer-address"
              error={errors.address?.message}
              span={12}
            >
              <FormInput
                id="customer-address"
                error={Boolean(errors.address)}
                {...register("address")}
              />
            </FormField>
            <FormField
              label="Notes"
              htmlFor="customer-notes"
              error={errors.notes?.message}
              span={12}
            >
              <FormTextarea
                id="customer-notes"
                error={Boolean(errors.notes)}
                {...register("notes")}
              />
            </FormField>
          </FormGrid>
        </FormSection>
      </FormShell>
    </AppShell>
  );
}
