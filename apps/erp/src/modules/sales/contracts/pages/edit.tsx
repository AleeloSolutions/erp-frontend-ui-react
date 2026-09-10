/**
 * Edit a contract, against `/api/v1/sales/contracts/<uuid>/`.
 *
 * Header-only (v1): no lines, so nothing here locks once "sent" the way
 * a quotation does. Status (draft/active/expired) changes immediately,
 * the same way a customer's archived toggle does, rather than waiting on
 * the form's own Save. Only a draft is ever hard-deleted (policy §10);
 * anything else is archived instead.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/app";
import { useSession } from "@/app/session";
import {
  ConfirmDialog,
  ControlPanel,
  FormDatePicker,
  FormDropdown,
  FormField,
  FormGrid,
  FormInput,
  FormSection,
  FormShell,
  FormStatusBar,
  FormStickyHeader,
  FormTextarea,
  PageActions,
  useToast,
  type FormStatusBarAction,
  type StatusStep,
} from "@erp/ui";
import { useSalesNavbar } from "@/modules/sales/useSalesNavbar";
import { can } from "@/modules/sales/shared";
import { useCustomersQuery } from "@/modules/sales/customers";
import {
  useContractQuery,
  useDeleteContractMutation,
  useUpdateContractMutation,
} from "../queries";
import {
  CONTRACT_STATUS_LABELS,
  contractFormSchema,
  emptyContractForm,
  type ContractFormValues,
} from "@/modules/sales/contracts/schema";
import { ApiError } from "@/lib/api-client";

const statusSteps: StatusStep[] = (
  Object.entries(CONTRACT_STATUS_LABELS) as [ContractFormValues["status"], string][]
).map(([key, label]) => ({ key, label }));

export default function ContractEditPage() {
  const { uuid = "" } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const navbar = useSalesNavbar("contracts");
  const canEdit = can(session?.permissions, "sales.contract", "edit");
  const canDelete = can(session?.permissions, "sales.contract", "delete");

  const contractQuery = useContractQuery(uuid);
  const contract = contractQuery.data;
  const isDraft = contract?.status === "draft";

  const updateMutation = useUpdateContractMutation();
  const deleteMutation = useDeleteContractMutation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const customersQuery = useCustomersQuery({
    ordering: "name",
    pageSize: 100,
    filters: { is_archived: "false" },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: emptyContractForm(),
  });

  // Re-seed once the record arrives; until then the form holds its defaults.
  useEffect(() => {
    if (!contract) return;
    reset({
      customer: contract.customer.uuid,
      name: contract.name,
      start_date: contract.start_date,
      end_date: contract.end_date,
      status: contract.status,
      value_amount: contract.value_amount,
      notes: contract.notes,
    });
  }, [contract, reset]);

  function report(error: unknown, fallback: string) {
    if (error instanceof ApiError && error.fields) {
      for (const [field, messages] of Object.entries(error.fields)) {
        if (field in contractFormSchema.shape) {
          setError(field as keyof ContractFormValues, { message: messages[0] });
        }
      }
    }
    toast({
      title: fallback,
      description: error instanceof ApiError ? error.message : "Please try again.",
      variant: "error",
    });
  }

  async function onSubmit(values: ContractFormValues) {
    try {
      await updateMutation.mutateAsync({ uuid, input: values });
      toast({ title: "Contract saved", variant: "success" });
    } catch (error) {
      report(error, "Could not save the contract");
    }
  }

  async function setStatus(status: ContractFormValues["status"]) {
    try {
      await updateMutation.mutateAsync({ uuid, input: { status } });
      toast({
        title: `Contract marked ${CONTRACT_STATUS_LABELS[status].toLowerCase()}`,
        variant: "success",
      });
    } catch (error) {
      report(error, "Could not update the contract");
    }
  }

  async function deleteDraft() {
    try {
      await deleteMutation.mutateAsync(uuid);
      toast({ title: "Contract deleted", variant: "success" });
      navigate("/sales/contracts");
    } catch (error) {
      report(error, "Could not delete the contract");
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
        ...(canDelete && isDraft
          ? [
              {
                key: "delete",
                label: "Delete",
                variant: "danger" as const,
                onClick: () => setConfirmingDelete(true),
              },
            ]
          : []),
        {
          key: "back",
          label: "Back",
          variant: "secondary",
          disabled: updateMutation.isPending,
          onClick: () => navigate("/sales/contracts"),
        },
      ]
    : [
        {
          key: "back",
          label: "Back",
          variant: "secondary",
          onClick: () => navigate("/sales/contracts"),
        },
      ];

  const notFound = contractQuery.isError;
  const loading = contractQuery.isLoading;

  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={<PageActions breadcrumb={contract ? contract.name : "Contract"} />}
        />

        {contract ? (
          <FormStatusBar
            sticky={false}
            steps={statusSteps}
            currentStepKey={contract.status}
            onStepChange={
              canEdit
                ? (key) => void setStatus(key as ContractFormValues["status"])
                : undefined
            }
            actions={actions}
          />
        ) : null}
      </FormStickyHeader>

      {notFound ? (
        <div className="rounded-[10px] border border-erp-border bg-erp-surface p-4 text-[12px] text-erp-muted">
          <p className="m-0 font-bold text-erp-text">Contract not found</p>
          <p className="mb-0 mt-1">
            It may have been deleted, or belong to a branch you cannot reach.{" "}
            <button
              type="button"
              className="font-bold text-erp-brand-third hover:underline"
              onClick={() => navigate("/sales/contracts")}
            >
              Back to contracts
            </button>
          </p>
        </div>
      ) : loading || !contract ? (
        <p className="p-4 text-[12px] text-erp-muted">Loading contract…</p>
      ) : (
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
                  disabled={!canEdit}
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
                  disabled={!canEdit || customersQuery.isLoading}
                  value={watch("customer") || null}
                  items={(customersQuery.data?.data ?? []).map((customer) => ({
                    key: customer.uuid,
                    label: customer.name,
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
                error={errors.start_date?.message}
                span={4}
              >
                <FormDatePicker
                  id="contract-start-date"
                  disabled={!canEdit}
                  error={Boolean(errors.start_date)}
                  {...register("start_date")}
                />
              </FormField>
              <FormField
                label="End date"
                required
                htmlFor="contract-end-date"
                error={errors.end_date?.message}
                span={4}
              >
                <FormDatePicker
                  id="contract-end-date"
                  disabled={!canEdit}
                  error={Boolean(errors.end_date)}
                  {...register("end_date")}
                />
              </FormField>
              <FormField
                label="Value"
                htmlFor="contract-value"
                error={errors.value_amount?.message}
                span={4}
              >
                <FormInput
                  id="contract-value"
                  inputMode="decimal"
                  disabled={!canEdit}
                  error={Boolean(errors.value_amount)}
                  {...register("value_amount")}
                />
              </FormField>
              <FormField label="Notes" htmlFor="contract-notes" span={12}>
                <FormTextarea
                  id="contract-notes"
                  disabled={!canEdit}
                  {...register("notes")}
                />
              </FormField>
            </FormGrid>
          </FormSection>
        </FormShell>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this draft?"
        description="It was never activated, so removing it leaves nothing behind. An active or expired contract is archived instead, never deleted."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => void deleteDraft()}
      />
    </AppShell>
  );
}
