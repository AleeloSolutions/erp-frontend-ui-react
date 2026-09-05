/**
 * Create / edit a user — the Access Rights form.
 *
 * Laid out like the ERP user forms people already know: identity at the
 * top, a lifecycle pill on the right, tabs underneath, then one row per
 * module with a level dropdown. Every row is backed by a real permission
 * level from `/api/v1/access-modules/`; choosing one grants the role that
 * level is stored as, so nothing here is decorative.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import {
  Button,
  ControlPanel,
  FormField,
  FormInput,
  Radio,
  Select,
  StatusBadge,
  Tabs,
  useToast,
} from "@erp/ui";
import { AppShell, useNavbarDefaults } from "@/app";
import { ApiError } from "@/lib/api-client";
import {
  NO_ACCESS,
  inviteUser,
  updateUser,
  useAccessModules,
  useTenantRoles,
  useTenantUser,
  type AccessModule,
  type TenantUser,
} from "../usersApi";

type BaseRole = "member" | "admin";

interface FormState {
  name: string;
  email: string;
  phone_number: string;
  baseRole: BaseRole;
  access: Record<string, string>;
}

const EMPTY: FormState = {
  name: "",
  email: "",
  phone_number: "",
  baseRole: "member",
  access: {},
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
    baseRole: user.roles.some((role) => role.name === "admin") ? "admin" : "member",
    access: { ...user.access },
  };
}

/** Modules in catalogue order, bucketed by their group heading. */
function byGroup(modules: AccessModule[]): [string, AccessModule[]][] {
  const groups = new Map<string, AccessModule[]>();
  for (const module of modules) {
    groups.set(module.group, [...(groups.get(module.group) ?? []), module]);
  }
  return [...groups.entries()];
}

export default function UserFormPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ brandLabel: "Settings" });

  const { user, loading } = useTenantUser(uuid);
  const modules = useAccessModules();
  const roles = useTenantRoles();

  const [values, setValues] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState("access");
  const [saving, setSaving] = useState(false);

  // Re-seed once the record arrives (creating starts from EMPTY).
  useEffect(() => {
    setValues(stateOf(user));
  }, [user]);

  const creating = uuid === undefined;
  // An administrator holds the whole catalogue, so the grid below is a
  // consequence rather than a choice — shown, but not editable.
  const isAdministrator = values.baseRole === "admin";
  const isOwner = user?.user_type === "owner";
  const groups = useMemo(() => byGroup(modules), [modules]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function setLevel(moduleKey: string, level: string) {
    setValues((current) => ({
      ...current,
      access: { ...current.access, [moduleKey]: level },
    }));
  }

  function levelOf(module: AccessModule): string {
    if (isAdministrator) return module.levels[module.levels.length - 1].key;
    return values.access[module.key] ?? NO_ACCESS;
  }

  async function handleSave() {
    setSaving(true);
    setFieldErrors({});
    // The radio is the base role; the grid is everything else. An
    // administrator needs no module rows — the admin role covers them.
    const baseRole = roles.find((role) => role.name === values.baseRole);
    const access = isAdministrator ? undefined : values.access;
    try {
      if (creating) {
        const created = await inviteUser({
          email: values.email,
          ...splitName(values.name),
          phone_number: values.phone_number,
          roles: baseRole ? [baseRole.uuid] : [],
          access,
        });
        toast({
          title: "Invite sent",
          description: `${created.email} can now set a password.`,
          variant: "success",
        });
      } else {
        await updateUser(uuid!, {
          ...splitName(values.name),
          phone_number: values.phone_number,
          roles: baseRole ? [baseRole.uuid] : [],
          access,
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
      <ControlPanel
        pageActions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Users
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              onClick={() => void handleSave()}
            >
              {creating ? "Create user" : "Save"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("/settings")}>
              Discard
            </Button>
          </div>
        }
        endSlot={
          creating ? null : (
            <div className="flex items-center gap-2 pe-1">
              <StatusBadge
                status={user?.email_verified_at ? "Confirmed" : "Pending"}
                label={user?.email_verified_at ? "Confirmed" : "Invited"}
              />
              <StatusBadge status={user?.is_active ? "Active" : "Inactive"} />
            </div>
          )
        }
      />

      <div className="rounded-sm border border-erp-border-soft bg-white px-4 py-5 sm:px-6">
        {/* Identity */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="grid h-[104px] w-[104px] shrink-0 place-items-center rounded-[10px] bg-erp-brand text-[38px] font-semibold text-white"
            aria-hidden
          >
            {initialsOf(values.name, values.email)}
          </div>
          <div className="grid w-full max-w-xl gap-3">
            <FormField
              label="Name"
              htmlFor="user-name"
              required
              error={fieldErrors.name?.[0]}
            >
              <FormInput
                id="user-name"
                value={values.name}
                placeholder="e.g. Hodan Ali"
                onChange={(event) => update("name", event.target.value)}
              />
            </FormField>
            <FormField
              label="Login"
              htmlFor="user-login"
              required
              description="The email address they sign in with."
              error={fieldErrors.email?.[0]}
            >
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-erp-muted" aria-hidden />
                <FormInput
                  id="user-login"
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
            align="container"
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
            <SectionHeading>Roles</SectionHeading>
            <div className="flex items-center gap-6 pb-2">
              <span className="w-[92px] text-[12px] text-erp-text">Role</span>
              <Radio
                id="role-member"
                name="base-role"
                label="User"
                checked={values.baseRole === "member"}
                disabled={isOwner}
                onChange={() => update("baseRole", "member")}
              />
              <Radio
                id="role-admin"
                name="base-role"
                label="Administrator"
                checked={isAdministrator}
                disabled={isOwner}
                onChange={() => update("baseRole", "admin")}
              />
            </div>
            <p className="m-0 mb-4 text-[11px] text-erp-muted">
              {isOwner
                ? "This is the workspace owner: they always hold every permission."
                : isAdministrator
                  ? "Administrators hold every permission, so the modules below follow automatically."
                  : "Pick what this user may do, module by module."}
            </p>

            <div className="grid gap-x-10 gap-y-1 lg:grid-cols-2">
              {groups.map(([group, groupModules]) => (
                <section key={group} className="break-inside-avoid">
                  <SectionHeading>{group}</SectionHeading>
                  <div className="mb-4">
                    {groupModules.map((module) => (
                      <div
                        key={module.key}
                        className="flex items-center justify-between gap-3 py-1"
                      >
                        <label
                          className="text-[12px] text-erp-text"
                          htmlFor={`access-${module.key}`}
                          title={module.help}
                        >
                          {module.label}
                        </label>
                        <Select
                          id={`access-${module.key}`}
                          chrome="underline"
                          className="w-[190px]"
                          disabled={isAdministrator || isOwner}
                          value={levelOf(module)}
                          options={module.levels.map((level) => ({
                            label: level.label,
                            value: level.key,
                          }))}
                          onChange={(event) => setLevel(module.key, event.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {modules.length === 0 && !loading ? (
              <p className="m-0 text-[12px] text-erp-muted">
                Sign in to a workspace to configure access rights.
              </p>
            ) : null}
          </div>
        ) : (
          <div
            role="tabpanel"
            aria-label="Security"
            className="grid gap-3 pt-5 text-[12px]"
          >
            <SectionHeading>Sign-in</SectionHeading>
            <Fact label="Email verified">
              {user?.email_verified_at
                ? new Date(user.email_verified_at).toLocaleString()
                : "Not yet — the invite link is still unopened."}
            </Fact>
            <Fact label="Status">
              {user?.is_active === false
                ? "Deactivated — this account cannot sign in."
                : "Active — this account may sign in."}
            </Fact>
            <Fact label="Roles held">
              {user?.roles.length
                ? user.roles.map((role) => role.name).join(", ")
                : "None yet"}
            </Fact>
            <p className="m-0 text-[11px] text-erp-muted">
              Deactivate or reactivate this user from the row menu on Manage Users.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-4 border-b border-erp-border-soft pb-1 text-[11px] font-bold uppercase tracking-[.06em] text-erp-text">
      {children}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-[120px] shrink-0 text-erp-subtle">{label}</span>
      <span className="text-erp-text">{children}</span>
    </div>
  );
}
