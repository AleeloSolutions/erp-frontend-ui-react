/**
 * Create / edit a branch — a shop, office or warehouse of the workspace.
 *
 * Same skeleton as the role and user forms: identity at the top, actions
 * in the status bar, the details underneath. The code is what document
 * numbers are prefixed with, so it is short and upper-case.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ControlPanel,
  FormField,
  FormInput,
  FormStatusBar,
  FormStickyHeader,
  PageActions,
  PageContainer,
  useToast,
  type StatusStep,
} from "@erp/ui";
import { AppShell, useNavbarDefaults } from "@/app";
import { ApiError } from "@/lib/api-client";
import { settingsNavbar } from "../settingsModules";
import { createBranch, updateBranch, useBranch, type BranchInput } from "../branchesApi";

const STATUS_STEPS: StatusStep[] = [
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
];

const EMPTY: BranchInput = {
  name: "",
  code: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  phone: "",
  email: "",
};

export default function BranchFormPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({
    ...settingsNavbar,
    submenuActiveKey: "general",
  });

  const { branch, loading } = useBranch(uuid);
  const [values, setValues] = useState<BranchInput>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  // Re-seed once the record arrives (creating starts empty).
  useEffect(() => {
    if (!branch) return;
    setValues({
      name: branch.name,
      code: branch.code,
      address_line1: branch.address_line1,
      address_line2: branch.address_line2,
      city: branch.city,
      state: branch.state,
      postal_code: branch.postal_code,
      country: branch.country,
      phone: branch.phone,
      email: branch.email,
    });
  }, [branch]);

  const creating = uuid === undefined;

  function update<K extends keyof BranchInput>(key: K, value: BranchInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setFieldErrors({});
    try {
      if (creating) {
        const created = await createBranch(values);
        toast({
          title: "Branch created",
          description: `${created.name} can now be assigned to users.`,
          variant: "success",
        });
      } else {
        await updateBranch(uuid!, values);
        toast({ title: "Branch saved", variant: "success" });
      }
      navigate("/settings");
    } catch (error) {
      if (error instanceof ApiError && error.fields) setFieldErrors(error.fields);
      toast({
        title: creating ? "Could not create the branch" : "Could not save the branch",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell activeNavKey="settings" activeMobileKey="more" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={
            <PageActions
              breadcrumb={creating ? "New Branch" : branch?.name || "Branch"}
            />
          }
        />

        <FormStatusBar
          sticky={false}
          steps={STATUS_STEPS}
          // Display-only: archiving is done from the branches table, where
          // the default branch is correctly not offered it.
          currentStepKey={branch?.is_archived ? "archived" : "active"}
          actions={[
            {
              key: "branches",
              label: "Branches",
              variant: "ghost",
              onClick: () => navigate("/settings"),
            },
            {
              key: "save",
              label: creating ? "Create Branch" : "Save",
              variant: "primary",
              loading: saving,
              onClick: () => void handleSave(),
            },
            {
              key: "discard",
              label: "Discard",
              variant: "secondary",
              disabled: saving,
              onClick: () => navigate("/settings"),
            },
          ]}
        />
      </FormStickyHeader>

      <PageContainer>
        <div className="mx-4 mt-4 rounded-sm border border-erp-border bg-white p-6 shadow-sm sm:p-8">
          <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
            <FormField
              label="Branch name"
              htmlFor="branch-name"
              required
              error={fieldErrors.name?.[0]}
            >
              <FormInput
                id="branch-name"
                chrome="underline"
                value={values.name ?? ""}
                placeholder="e.g. Mogadishu"
                onChange={(event) => update("name", event.target.value)}
              />
            </FormField>
            <FormField
              label="Code"
              htmlFor="branch-code"
              required
              description="Short, upper-case. Document numbers carry it, e.g. INV-MOG-000123."
              error={fieldErrors.code?.[0]}
            >
              <FormInput
                id="branch-code"
                chrome="underline"
                value={values.code ?? ""}
                placeholder="MOG"
                maxLength={10}
                onChange={(event) => update("code", event.target.value.toUpperCase())}
              />
            </FormField>
          </div>

          <SectionHeading>Address</SectionHeading>
          <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
            <FormField label="Address line 1" htmlFor="branch-address1">
              <FormInput
                id="branch-address1"
                chrome="underline"
                value={values.address_line1 ?? ""}
                onChange={(event) => update("address_line1", event.target.value)}
              />
            </FormField>
            <FormField label="Address line 2" htmlFor="branch-address2">
              <FormInput
                id="branch-address2"
                chrome="underline"
                value={values.address_line2 ?? ""}
                onChange={(event) => update("address_line2", event.target.value)}
              />
            </FormField>
            <FormField label="City" htmlFor="branch-city">
              <FormInput
                id="branch-city"
                chrome="underline"
                value={values.city ?? ""}
                onChange={(event) => update("city", event.target.value)}
              />
            </FormField>
            <FormField label="State or region" htmlFor="branch-state">
              <FormInput
                id="branch-state"
                chrome="underline"
                value={values.state ?? ""}
                onChange={(event) => update("state", event.target.value)}
              />
            </FormField>
            <FormField label="Postal code" htmlFor="branch-postal">
              <FormInput
                id="branch-postal"
                chrome="underline"
                value={values.postal_code ?? ""}
                onChange={(event) => update("postal_code", event.target.value)}
              />
            </FormField>
            <FormField
              label="Country"
              htmlFor="branch-country"
              description="Two-letter code, e.g. SO."
              error={fieldErrors.country?.[0]}
            >
              <FormInput
                id="branch-country"
                chrome="underline"
                value={values.country ?? ""}
                placeholder="SO"
                maxLength={2}
                onChange={(event) => update("country", event.target.value.toUpperCase())}
              />
            </FormField>
          </div>

          <SectionHeading>Contact</SectionHeading>
          <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
            <FormField
              label="Phone"
              htmlFor="branch-phone"
              error={fieldErrors.phone?.[0]}
            >
              <FormInput
                id="branch-phone"
                chrome="underline"
                type="tel"
                value={values.phone ?? ""}
                placeholder="+252612345678"
                onChange={(event) => update("phone", event.target.value)}
              />
            </FormField>
            <FormField
              label="Email"
              htmlFor="branch-email"
              error={fieldErrors.email?.[0]}
            >
              <FormInput
                id="branch-email"
                chrome="underline"
                type="email"
                value={values.email ?? ""}
                placeholder="branch@company.com"
                onChange={(event) => update("email", event.target.value)}
              />
            </FormField>
          </div>

          {!creating && !loading && branch === null ? (
            <p className="m-0 mt-4 text-[12px] text-erp-muted">
              This branch could not be loaded.
            </p>
          ) : null}
        </div>
      </PageContainer>
    </AppShell>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 text-[11px] font-bold uppercase tracking-[.08em] text-erp-brand-third">
      {children}
    </div>
  );
}
