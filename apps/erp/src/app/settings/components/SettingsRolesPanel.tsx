/**
 * Settings → Users → Manage Roles.
 *
 * The tenant's roles over `/api/v1/roles/`: a handful of rows, so the
 * table is filled client-side. Creating and editing open the role form;
 * deleting asks first and refuses for the seeded system roles.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ConfirmDialog,
  ControlPanel,
  DataTable,
  PageActions,
  StatusBadge,
  useToast,
  type DataTableRowAction,
} from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import { SettingsDetailBack } from "./SettingsDetailBack";
import { ROLE_CODES, deleteRole, useRoles, type Role } from "../rolesApi";
import { useCurrentUser } from "../usersApi";

export function SettingsRolesPanel({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const me = useCurrentUser();
  const { roles, loading, error, reload } = useRoles();
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null);

  // The owner holds every code implicitly; a member needs the grant.
  const held = me?.permissions ?? [];
  const canCreate = held.includes(ROLE_CODES.create);
  const canEdit = held.includes(ROLE_CODES.edit);
  const canDelete = held.includes(ROLE_CODES.delete);

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Role",
        meta: { fill: true },
        size: 220,
        cell: ({ row }) => {
          const role = row.original;
          return canEdit ? (
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
              onClick={() => navigate(`/settings/roles/${role.uuid}`)}
            >
              {role.name}
            </button>
          ) : (
            <span>{role.name}</span>
          );
        },
      },
      {
        id: "permissions",
        header: "Permissions",
        size: 120,
        accessorFn: (role) => role.permissions.length,
        cell: ({ row }) => {
          const count = row.original.permissions.length;
          return count === 0 ? "None" : `${count} granted`;
        },
      },
      {
        accessorKey: "user_count",
        header: "Users",
        size: 90,
      },
      {
        accessorKey: "is_system",
        header: "Type",
        size: 110,
        cell: ({ getValue }) => <StatusBadge status={getValue() ? "System" : "Custom"} />,
      },
    ],
    [canEdit, navigate]
  );

  /** Only the actions this viewer may actually perform are offered. */
  function rowActions(role: Role): DataTableRowAction[] {
    const actions: DataTableRowAction[] = [];
    if (canEdit) {
      actions.push({
        key: "edit",
        label: "Edit",
        onClick: () => navigate(`/settings/roles/${role.uuid}`),
      });
    }
    // System roles cannot be deleted -- the backend enforces it; not
    // offering it says so up front.
    if (canDelete && !role.is_system) {
      actions.push({
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => setPendingDelete(role),
      });
    }
    return actions;
  }

  async function remove(role: Role) {
    try {
      await deleteRole(role.uuid);
      toast({
        title: "Role deleted",
        description: `${role.name} is gone; anyone who held it now holds no role.`,
        variant: "success",
      });
      setPendingDelete(null);
      reload();
    } catch (err) {
      toast({
        title: "Could not delete the role",
        description: err instanceof ApiError ? err.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <div role="tabpanel" aria-label="Manage Roles">
      <SettingsDetailBack onBack={onBack} />

      <DataTable
        tableId="settings-roles"
        renderToolbar={({ searchFilter }) => (
          <ControlPanel
            pageActions={
              canCreate ? (
                <PageActions
                  buttons={[
                    {
                      key: "create",
                      children: "New",
                      variant: "primary",
                      size: "sm",
                      onClick: () => navigate("/settings/roles/new"),
                    },
                  ]}
                />
              ) : undefined
            }
          >
            {searchFilter}
          </ControlPanel>
        )}
        columns={columns}
        data={roles}
        searchable
        searchPlaceholder="Search roles…"
        loading={loading}
        error={error}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={false}
        emptyMessage="No roles yet."
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this role?"
        description={
          pendingDelete
            ? `${pendingDelete.name} is held by ${pendingDelete.user_count} ${pendingDelete.user_count === 1 ? "user" : "users"}. They will hold no role until you give them another.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete);
        }}
      />
    </div>
  );
}
