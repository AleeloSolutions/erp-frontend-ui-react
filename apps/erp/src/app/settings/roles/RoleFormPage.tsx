/**
 * Create / edit a role — a name and the permission grid.
 *
 * Same skeleton as the user form: identity at the top, actions in the
 * status bar, the grid underneath. Every tick is a real permission code
 * from `/api/v1/permissions/matrix/`; saving stores exactly those codes on
 * the role (plus the own-scope twins the full verbs imply).
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ConfirmDialog,
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
import {
  NO_ACCESS,
  ROLE_CODES,
  createRole,
  deleteRole,
  scopeOf,
  updateRole,
  usePermissionMatrix,
  useRole,
} from "../rolesApi";
import { useCurrentUser } from "../usersApi";
import { PermissionMatrixGrid } from "./PermissionMatrix";

const KIND_STEPS: StatusStep[] = [
  { key: "custom", label: "Custom" },
  { key: "system", label: "System" },
];

export default function RoleFormPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({
    ...settingsNavbar,
    submenuActiveKey: "general",
  });

  const { role, loading } = useRole(uuid);
  const matrix = usePermissionMatrix();
  const me = useCurrentUser();

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-seed once the record arrives (creating starts empty).
  useEffect(() => {
    setName(role?.name ?? "");
    setSelected(new Set(role?.permissions ?? []));
  }, [role]);

  const creating = uuid === undefined;
  const held = me?.permissions ?? null;
  const canDelete =
    Boolean(held?.includes(ROLE_CODES.delete)) && !creating && !role?.is_system;

  /** You cannot hand out access you do not hold: the API refuses it, so
   * the tick is not offered either. Unknown codes (still loading) leave
   * everything enabled -- the API is the boundary, not this. */
  const canConfer = useMemo(
    () => (code: string) => held === null || held.includes(code),
    [held]
  );

  // Cells granted, not codes: one dropdown set to "this branch" is one
  // permission to an administrator, however many rungs it stores.
  const grantCount = useMemo(() => {
    if (!matrix) return selected.size;
    return matrix.resources.reduce(
      (count, resource) =>
        count +
        resource.cells.filter((cell) => scopeOf(cell, selected) !== NO_ACCESS).length,
      0
    );
  }, [matrix, selected]);

  async function handleSave() {
    setSaving(true);
    setFieldErrors({});
    const input = { name: name.trim(), permissions: [...selected].sort() };
    try {
      if (creating) {
        const created = await createRole(input);
        toast({
          title: "Role created",
          description: `${created.name} can now be given to users.`,
          variant: "success",
        });
      } else {
        await updateRole(uuid!, input);
        toast({ title: "Role saved", variant: "success" });
      }
      navigate("/settings");
    } catch (error) {
      if (error instanceof ApiError && error.fields) setFieldErrors(error.fields);
      toast({
        title: creating ? "Could not create the role" : "Could not save the role",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!uuid) return;
    setSaving(true);
    try {
      await deleteRole(uuid);
      toast({
        title: "Role deleted",
        description: "Anyone who held it now holds no role.",
        variant: "success",
      });
      navigate("/settings");
    } catch (error) {
      toast({
        title: "Could not delete the role",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  return (
    <AppShell activeNavKey="settings" activeMobileKey="more" navbar={navbar}>
      <FormStickyHeader>
        <ControlPanel
          sticky={false}
          pageActions={
            <PageActions breadcrumb={creating ? "New Role" : role?.name || "Role"} />
          }
        />

        <FormStatusBar
          sticky={false}
          steps={KIND_STEPS}
          // Display-only: a role is seeded as system at signup or made by
          // hand; nothing here changes which.
          currentStepKey={role?.is_system ? "system" : "custom"}
          actions={[
            {
              key: "roles",
              label: "Roles",
              variant: "ghost",
              onClick: () => navigate("/settings"),
            },
            {
              key: "save",
              label: creating ? "Create Role" : "Save",
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
            ...(canDelete
              ? [
                  {
                    key: "delete",
                    label: "Delete",
                    variant: "danger" as const,
                    disabled: saving,
                    onClick: () => setConfirmDelete(true),
                  },
                ]
              : []),
          ]}
        />
      </FormStickyHeader>

      <PageContainer>
        <div className="mx-4 mt-4 rounded-sm border border-erp-border bg-white p-6 shadow-sm sm:p-8">
          <div className="grid w-full max-w-3xl gap-4">
            <FormField
              label="Role name"
              htmlFor="role-name"
              required
              error={fieldErrors.name?.[0]}
            >
              <FormInput
                id="role-name"
                chrome="underline"
                value={name}
                placeholder="e.g. Accountant"
                onChange={(event) => setName(event.target.value)}
              />
            </FormField>
          </div>

          <div className="mb-3 mt-8 flex items-baseline justify-between gap-4">
            <div className="text-[11px] font-bold uppercase tracking-[.08em] text-erp-brand-third">
              Permissions
            </div>
            <div className="text-[12px] text-erp-muted">
              {grantCount} {grantCount === 1 ? "permission" : "permissions"} granted
            </div>
          </div>
          <p className="m-0 mb-4 text-[12px] text-erp-muted">
            Each cell says how far that action reaches. &ldquo;All branches&rdquo; is the
            whole workspace, &ldquo;This branch&rdquo; is only the user&rsquo;s own
            branch, and &ldquo;Own records&rdquo; is only what they created or are
            assigned to. A wider setting always includes the narrower ones.
            {fieldErrors.permissions?.[0] ? (
              <span className="ml-2 text-erp-danger">{fieldErrors.permissions[0]}</span>
            ) : null}
          </p>

          <PermissionMatrixGrid
            matrix={matrix}
            selected={selected}
            onChange={setSelected}
            canConfer={canConfer}
          />

          {!creating && !loading && role === null ? (
            <p className="m-0 mt-4 text-[12px] text-erp-muted">
              This role could not be loaded.
            </p>
          ) : null}
        </div>
      </PageContainer>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this role?"
        description={
          role
            ? `${role.name} is held by ${role.user_count} ${role.user_count === 1 ? "user" : "users"}. They will hold no role until you give them another.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </AppShell>
  );
}
