import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Users } from "lucide-react";
import { AppShell, PageHeader, PageSubmenu } from "@/app";
import {
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormSelect,
  FormShell,
  FormTextarea,
} from "@erp/ui";
import { useToast } from "@erp/ui";
import { salesSubmenu } from "@/modules/sales/manifest";
import { useCreateCustomerMutation } from "@/modules/sales/api";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "@/modules/sales/customers/schema";
import { MockApiError } from "@/lib/mock";

export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMutation = useCreateCustomerMutation();

  const {
    register,
    handleSubmit,
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
        error instanceof MockApiError
          ? error.message
          : "Could not create customer.";
      toast({ title: "Create failed", description: message, variant: "error" });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="create">
      <PageHeader
        module="Sales"
        section="Customers"
        title="Create Customer"
        description="Compose FormShell with a Query mutation and toast feedback."
        icon={<Users className="h-4 w-4" aria-hidden />}
      />

      <PageSubmenu module="Sales" items={salesSubmenu} activeKey="customers" />

      <FormShell
        title="New customer"
        description='Required fields are marked. Use an email containing "fail" to simulate a server error.'
        onSubmit={handleSubmit(onSubmit)}
        actionProps={{
          submitLabel: "Create customer",
          submitting: createMutation.isPending,
          onCancel: () => navigate("/sales/customers"),
        }}
      >
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
              label="Status"
              required
              htmlFor="customer-status"
              error={errors.status?.message}
              span={6}
            >
              <FormSelect
                id="customer-status"
                error={Boolean(errors.status)}
                options={[
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
                ]}
                {...register("status")}
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
                rows={3}
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
