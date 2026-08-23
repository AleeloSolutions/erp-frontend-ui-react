import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell, useNavbarDefaults } from "@/app";
import {
  ControlPanel,
  FormDatePicker,
  FormDropdown,
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormShell,
  FormStatusBar,
  PageActions,
  type StatusStep,
} from "@erp/ui";
import { useToast } from "@erp/ui";
import { salesNavbar } from "@/modules/sales/manifest";
import { useCreateContractMutation } from "@/modules/sales/api";
import { mockCustomers } from "@/modules/sales/data/demo-table";
import {
  contractFormSchema,
  type ContractFormValues,
} from "@/modules/sales/contracts/schema";
import { MockApiError } from "@/lib/mock";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const statusSteps: StatusStep[] = [
  { key: "Draft", label: "Draft" },
  { key: "Active", label: "Active" },
  { key: "Expired", label: "Expired" },
];

export default function ContractCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...salesNavbar, submenuActiveKey: "contracts" });
  const createMutation = useCreateContractMutation();

  const customerOptions = useMemo(
    () =>
      mockCustomers.map((customer) => ({
        label: customer.name,
        value: customer.name,
      })),
    []
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      name: "",
      customer: "",
      startDate: todayIso(),
      endDate: plusDaysIso(365),
      status: "Draft",
      value: "",
    },
  });

  async function onSubmit(values: ContractFormValues) {
    try {
      const contract = await createMutation.mutateAsync({
        name: values.name,
        customer: values.customer,
        startDate: values.startDate,
        endDate: values.endDate,
        status: values.status,
        value: Number(values.value),
      });
      toast({
        title: "Contract created",
        description: `${contract.name} was added successfully.`,
        variant: "success",
      });
      navigate("/sales/contracts");
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not create contract.";
      toast({ title: "Create failed", description: message, variant: "error" });
    }
  }

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <ControlPanel pageActions={<PageActions breadcrumb="New Contract" />} />

      <FormStatusBar
        belowControlPanel
        steps={statusSteps}
        currentStepKey={watch("status")}
        onStepChange={(key) =>
          setValue("status", key as ContractFormValues["status"], { shouldDirty: true })
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
            onClick: () => navigate("/sales/contracts"),
          },
        ]}
      />

      <FormShell onSubmit={handleSubmit(onSubmit)}>
        <FormSection title="Contract details">
          <FormGrid columns={12}>
            <FormField
              label="Contract name"
              required
              htmlFor="contract-name"
              error={errors.name?.message}
              span={6}
            >
              <FormInput
                id="contract-name"
                error={Boolean(errors.name)}
                {...register("name")}
              />
            </FormField>
            <FormField
              label="Customer"
              required
              htmlFor="contract-customer"
              error={errors.customer?.message}
              span={6}
            >
              <FormDropdown
                id="contract-customer"
                searchable
                placeholder="Search customer..."
                error={Boolean(errors.customer)}
                value={watch("customer") || null}
                items={customerOptions.map((option) => ({
                  key: option.value,
                  label: option.label,
                }))}
                onChange={(key) =>
                  setValue("customer", key ?? "", {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </FormField>
            <FormField
              label="Start date"
              required
              htmlFor="contract-start-date"
              error={errors.startDate?.message}
              span={4}
            >
              <FormDatePicker
                id="contract-start-date"
                error={Boolean(errors.startDate)}
                {...register("startDate")}
              />
            </FormField>
            <FormField
              label="End date"
              required
              htmlFor="contract-end-date"
              error={errors.endDate?.message}
              span={4}
            >
              <FormDatePicker
                id="contract-end-date"
                error={Boolean(errors.endDate)}
                {...register("endDate")}
              />
            </FormField>
            <FormField
              label="Value"
              required
              htmlFor="contract-value"
              error={errors.value?.message}
              span={4}
            >
              <FormInput
                id="contract-value"
                type="number"
                step="0.01"
                min="0"
                error={Boolean(errors.value)}
                {...register("value")}
              />
            </FormField>
          </FormGrid>
        </FormSection>
      </FormShell>
    </AppShell>
  );
}
