/**
 * Create / edit a user — identity, the one role they hold, and security.
 *
 * Laid out like the ERP user forms people already know: identity at the
 * top, a lifecycle pill on the right, tabs underneath. Access is a branch
 * plus a single role picked from the tenant's roles (the Rise shape); the
 * grid below the pickers is a read-only view of what that role allows, so
 * whoever is granting it sees what they are giving. Roles themselves are
 * edited under Settings → Users → Roles.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import {
  ControlPanel,
  FormDropdown,
  FormField,
  FormInput,
  FormStatusBar,
  FormStickyHeader,
  PageActions,
  PageContainer,
  Tabs,
  useToast,
  type StatusStep,
} from "@erp/ui";
import { AppShell, useNavbarDefaults } from "@/app";
import { ApiError } from "@/lib/api-client";
import {
  ROLE_CODES,
  completeCodes,
  needsBranch,
  usePermissionMatrix,
  type Role,
} from "../rolesApi";
import { useBranches } from "../branchesApi";
import {
  USER_CODES,
  inviteUser,
  isConfirmed,
  updateUser,
  uploadAvatar,
  useCurrentUser,
  useTenantRoles,
  useTenantUser,
  type TenantUser,
} from "../usersApi";
import { PermissionMatrixGrid } from "../roles/PermissionMatrix";
import { AvatarField } from "./AvatarField";
import { SecurityTab } from "./SecurityTab";

/** The account's own lifecycle, shown in the form's statusbar. */
const INVITE_STEPS: StatusStep[] = [
  { key: "invited", label: "Invited" },
  { key: "confirmed", label: "Confirmed" },
];

/** The dropdown key for "no role" and "no branch". */
const NONE = "__none";

interface FormState {
  name: string;
  email: string;
  phone_number: string;
  /** The role's uuid, or null for none. */
  role: string | null;
  /** The branch's uuid, or null for workspace-wide. */
  branch: string | null;
}

const EMPTY: FormState = {
  name: "",
  email: "",
  phone_number: "",
  role: null,
  branch: null,
};

/** "Hodan Ali" -> first/last, the same split signup uses. */
function splitName(name: string): { first_name: string; last_name: string } {
  const [first = "", ...rest] = name.trim().split(/\s+/);
  return { first_name: first, last_name: rest.join(" ") };
}

function initialsOf(name: string, email: string): string {
  const source = name.trim() || email.trim();
  if (!source) return "?";
  const [first = "", second = ""] = source.split(/[\s@.]+/);
  return ((first[0] ?? "") + (second[0] ?? "")).toUpperCase() || source[0].toUpperCase();
}

function stateOf(user: TenantUser | null): FormState {
  if (!user) return EMPTY;
  return {
    name: user.full_name || "",
    email: user.email,
    phone_number: user.phone_number,
    role: user.role?.uuid ?? null,
    branch: user.branch?.uuid ?? null,
  };
}

export default function UserFormPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ brandLabel: "Settings" });

  const { user, loading, reload } = useTenantUser(uuid);
  const roles = useTenantRoles();
  const { branches } = useBranches();
  const matrix = usePermissionMatrix();
  const me = useCurrentUser();

  const [values, setValues] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState("access");
  const [saving, setSaving] = useState(false);
  // Chosen before the account exists; uploaded once it does.
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);

  // Re-seed once the record arrives (creating starts from EMPTY).
  useEffect(() => {
    setValues(stateOf(user));
  }, [user]);

  const creating = uuid === undefined;
  const confirmed = isConfirmed(user);

  // An invite is confirmed elsewhere -- in their inbox, or at the login
  // screen -- so the indicator follows the record rather than this form:
  // poll while it is still outstanding, and re-check on refocus. It stops
  // the moment it flips, and never runs while creating.
  useEffect(() => {
    if (creating || confirmed) return;
    const timer = window.setInterval(reload, 10_000);
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [creating, confirmed, reload]);

  const isOwner = user?.user_type === "owner";
  const held = me?.permissions ?? null;
  const canManage = Boolean(held && (held.includes(USER_CODES.edit) || creating));
  const canEditRoles = Boolean(held?.includes(ROLE_CODES.edit));

  /** You cannot hand out access you do not hold: the API refuses it, so
   * the role is not offered either. Unknown codes (still loading) leave
   * everything enabled -- the API is the boundary, not this. */
  function canConfer(role: Role): boolean {
    if (held === null) return true;
    return completeCodes(matrix, role.permissions).every((code) => held.includes(code));
  }

  const chosenRole = useMemo(
    () => roles.find((role) => role.uuid === values.role) ?? null,
    [roles, values.role]
  );
  /** What the picked role allows -- or everything, for the owner. */
  const shownCodes = useMemo<Set<string>>(() => {
    if (isOwner && matrix) {
      return new Set(
        matrix.resources.flatMap((resource) =>
          resource.cells.flatMap((cell) => cell.options.map((option) => option.code))
        )
      );
    }
    return new Set(chosenRole?.permissions ?? []);
  }, [isOwner, matrix, chosenRole]);

  /** A role whose widest rung is the branch one resolves through the
   * branch column, so the API refuses the pair without one. Say so before
   * they save. */
  const branchRequired =
    !isOwner && values.branch === null && needsBranch(chosenRole?.permissions ?? []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setFieldErrors({});
    try {
      if (creating) {
        const created = await inviteUser({
          email: values.email,
          ...splitName(values.name),
          phone_number: values.phone_number,
          role: values.role,
          branch: values.branch,
        });
        if (pendingAvatar) await uploadAvatar(created.uuid, pendingAvatar);
        toast({
          title: "Invite sent",
          description: `${created.email} can now set a password.`,
          variant: "success",
        });
      } else {
        await updateUser(uuid!, {
          ...splitName(values.name),
          phone_number: values.phone_number,
          branch: values.branch,
          // The owner holds everything implicitly; there is nothing to set.
          ...(isOwner ? {} : { role: values.role }),
        });
        toast({ title: "User saved", variant: "success" });
      }
      navigate("/settings");
    } catch (error) {
      if (error instanceof ApiError && error.fields) setFieldErrors(error.fields);
      toast({
        title: creating ? "Could not invite" : "Could not save the user",
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
              breadcrumb={
                creating ? "New User" : user?.full_name || user?.email || "User"
              }
            />
          }
        />

        <FormStatusBar
          sticky={false}
          steps={INVITE_STEPS}
          // Display-only on purpose: an invite is confirmed by the person
          // signing in, so passing onStepChange would let an admin claim it
          // happened. The bar follows the record instead.
          currentStepKey={confirmed ? "confirmed" : "invited"}
          actions={[
            {
              key: "users",
              label: "Users",
              variant: "ghost",
              onClick: () => navigate("/settings"),
            },
            {
              key: "save",
              label: creating ? "Create User" : "Save",
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
        {/* The contained form card: inset from the page edges, or its
            border lands off-screen and the sheet reads as a bare page. */}
        <div className="mx-4 mt-4 rounded-sm border border-erp-border bg-white p-6 shadow-sm sm:p-8">
          {/* Identity */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <AvatarField
              userUuid={uuid ?? null}
              src={user?.avatar ?? null}
              initials={initialsOf(values.name, values.email)}
              editable={canManage || creating}
              pendingFile={pendingAvatar}
              onPendingFileChange={setPendingAvatar}
              onChanged={reload}
            />
            <div className="grid w-full max-w-3xl gap-4">
              <FormField
                label="Name"
                htmlFor="user-name"
                required
                error={fieldErrors.name?.[0]}
              >
                <FormInput
                  id="user-name"
                  chrome="underline"
                  value={values.name}
                  placeholder="e.g. Hodan Ali"
                  onChange={(event) => update("name", event.target.value)}
                />
              </FormField>
              <FormField
                label="Login"
                htmlFor="user-login"
                required
                error={fieldErrors.email?.[0]}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-erp-muted" aria-hidden />
                  <FormInput
                    id="user-login"
                    chrome="underline"
                    type="email"
                    value={values.email}
                    placeholder="name@company.com"
                    // The login identifier is set once, when the invite is sent.
                    disabled={!creating}
                    onChange={(event) => update("email", event.target.value)}
                  />
                </div>
              </FormField>
              <FormField
                label="Phone"
                htmlFor="user-phone"
                error={fieldErrors.phone_number?.[0]}
              >
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-erp-muted" aria-hidden />
                  <FormInput
                    id="user-phone"
                    chrome="underline"
                    type="tel"
                    value={values.phone_number}
                    placeholder="+252612345678"
                    onChange={(event) => update("phone_number", event.target.value)}
                  />
                </div>
              </FormField>
            </div>
          </div>

          <div className="mt-6">
            <Tabs
              align="bleed"
              items={[
                { key: "access", label: "Access Rights" },
                { key: "security", label: "Security" },
              ]}
              activeKey={activeTab}
              onChange={setActiveTab}
              aria-label="User sections"
            />
          </div>

          {activeTab === "access" ? (
            <div role="tabpanel" aria-label="Access Rights" className="pt-5">
              <SectionHeading>Branch and role</SectionHeading>
              <div className="grid gap-4 border-b border-erp-border-soft pb-6">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                  <label className="w-[92px] text-erp-form-label" htmlFor="user-branch">
                    Branch
                  </label>
                  <FormDropdown
                    id="user-branch"
                    chrome="underline"
                    searchable
                    className="w-[260px]"
                    error={branchRequired || Boolean(fieldErrors.branch?.[0])}
                    value={values.branch ?? NONE}
                    items={[
                      { key: NONE, label: "No branch (workspace-wide)" },
                      ...branches
                        .filter(
                          (branch) => !branch.is_archived || branch.uuid === values.branch
                        )
                        .map((branch) => ({
                          key: branch.uuid,
                          label: `${branch.name} (${branch.code})`,
                        })),
                    ]}
                    onChange={(key) => update("branch", key && key !== NONE ? key : null)}
                  />
                  {fieldErrors.branch?.[0] ? (
                    <span className="text-[12px] text-erp-danger">
                      {fieldErrors.branch[0]}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                  <label className="w-[92px] text-erp-form-label" htmlFor="user-role">
                    Role
                  </label>
                  <FormDropdown
                    id="user-role"
                    chrome="underline"
                    searchable
                    className="w-[260px]"
                    disabled={isOwner}
                    value={isOwner ? NONE : (values.role ?? NONE)}
                    items={[
                      {
                        key: NONE,
                        label: isOwner ? "Owner (all permissions)" : "No role",
                      },
                      ...roles.map((role) => ({
                        key: role.uuid,
                        label: role.name,
                        // Except the role they already hold, which must stay
                        // selectable for the form to save.
                        disabled: !canConfer(role) && role.uuid !== values.role,
                      })),
                    ]}
                    onChange={(key) => update("role", key && key !== NONE ? key : null)}
                  />
                  {fieldErrors.role?.[0] ? (
                    <span className="text-[12px] text-erp-danger">
                      {fieldErrors.role[0]}
                    </span>
                  ) : null}
                </div>

                {branchRequired ? (
                  <p className="m-0 text-[12px] text-erp-danger">
                    {chosenRole?.name} grants access at branch level, so this user needs a
                    branch.
                  </p>
                ) : null}
              </div>

              <div className="mb-3 mt-6 flex items-baseline justify-between gap-4">
                <SectionHeading className="mb-0 mt-0">
                  {isOwner
                    ? "What the owner can do"
                    : chosenRole
                      ? `What "${chosenRole.name}" allows`
                      : "What this user can do"}
                </SectionHeading>
                {chosenRole && canEditRoles ? (
                  <button
                    type="button"
                    className="border-0 bg-transparent p-0 text-[12px] text-erp-brand-third hover:underline"
                    onClick={() => navigate(`/settings/roles/${chosenRole.uuid}`)}
                  >
                    Edit role
                  </button>
                ) : null}
              </div>
              {!isOwner && !chosenRole ? (
                <p className="m-0 mb-4 text-[12px] text-erp-muted">
                  Without a role this user can sign in and see their colleagues, and
                  nothing else. Pick a role above to give them access.
                </p>
              ) : null}
              <PermissionMatrixGrid matrix={matrix} selected={shownCodes} readOnly />

              {roles.length === 0 && !loading ? (
                <p className="m-0 mt-4 text-[12px] text-erp-muted">
                  Sign in to a workspace to configure access rights.
                </p>
              ) : null}
            </div>
          ) : (
            <SecurityTab user={user} me={me} canManage={canManage} />
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}

function SectionHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-3 mt-6 text-[11px] font-bold uppercase tracking-[.08em] text-erp-brand-third ${className}`}
    >
      {children}
    </div>
  );
}
