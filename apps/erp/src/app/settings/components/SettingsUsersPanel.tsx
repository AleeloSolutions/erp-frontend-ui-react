/**
 * Settings → Users → Manage Users.
 *
 * A real table over `/api/v1/users/`: the backend does the paging,
 * searching, sorting and filtering, so this asks for one page at a time.
 * Every control here is wired — inviting, editing, activating and
 * deactivating all hit the API and re-read the page afterwards.
 */

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  ConfirmDialog,
  ControlPanel,
  DataTable,
  PageActions,
  StatusBadge,
  useDebounce,
  useToast,
  type DataTableFilter,
  type DataTableFilterValues,
  type DataTableRowAction,
} from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import { SettingsDetailBack } from "./SettingsDetailBack";
import { UserFormDrawer, type UserFormValues } from "./UserFormDrawer";
import {
  inviteUser,
  updateUser,
  useCurrentUser,
  useTenantRoles,
  useTenantUsers,
  type TenantUser,
} from "../usersApi";

const MANAGE_USERS = "settings.user.manage";

/** DataTable sorting -> DRF `?ordering=`; `-` means descending. */
function orderingOf(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "email";
  return first.desc ? `-${first.id}` : first.id;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}

export function SettingsUsersPanel({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const me = useCurrentUser();
  const roles = useTenantRoles();

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: "email", desc: false }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editing, setEditing] = useState<TenantUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingDeactivation, setPendingDeactivation] = useState<TenantUser | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const statusFilter = String(filterValues.is_active ?? "");

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      isActive: (statusFilter === "true" || statusFilter === "false"
        ? statusFilter
        : "") as "" | "true" | "false",
      ordering: orderingOf(sorting),
      page,
      pageSize,
    }),
    [debouncedSearch, statusFilter, sorting, page, pageSize]
  );

  const { users, total, loading, error, reload } = useTenantUsers(params);
  // The owner holds every code implicitly; a member needs the grant.
  const canManage = Boolean(me?.permissions.includes(MANAGE_USERS));

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "is_active",
        label: "Status",
        type: "select",
        placeholder: "All users",
        options: [
          { label: "Active", value: "true" },
          { label: "Deactivated", value: "false" },
        ],
      },
    ],
    []
  );

  const columns = useMemo<ColumnDef<TenantUser>[]>(() => {
    const base: ColumnDef<TenantUser>[] = [
      {
        accessorKey: "full_name",
        header: "User",
        meta: { fill: true },
        size: 200,
        cell: ({ row }) => {
          const user = row.original;
          const label = user.full_name || user.email;
          return (
            <div className="flex flex-col">
              {canManage ? (
                <button
                  type="button"
                  className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
                  onClick={() => {
                    setEditing(user);
                    setDrawerOpen(true);
                  }}
                >
                  {label}
                </button>
              ) : (
                <span>{label}</span>
              )}
              {user.email_verified_at === null ? (
                <span className="text-[11px] text-erp-muted">Invite pending</span>
              ) : null}
            </div>
          );
        },
      },
      { accessorKey: "email", header: "Email", size: 200 },
      {
        accessorKey: "phone_number",
        header: "Phone",
        size: 130,
        cell: ({ getValue }) => String(getValue() || "—"),
      },
      {
        id: "roles",
        header: "Roles",
        enableSorting: false,
        size: 160,
        cell: ({ row }) => {
          const user = row.original;
          if (user.user_type === "owner") return "Owner (all permissions)";
          return user.roles.length
            ? user.roles.map((role) => role.name).join(", ")
            : "No role";
        },
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 110,
        cell: ({ getValue }) => (
          <StatusBadge status={getValue() ? "Active" : "Inactive"} />
        ),
      },
      {
        accessorKey: "created_at",
        header: "Added",
        size: 120,
        cell: ({ getValue }) => formatDate(String(getValue())),
      },
    ];
    return base;
  }, [canManage]);

  /** Only the actions this viewer may actually perform are offered. */
  function rowActions(user: TenantUser): DataTableRowAction[] {
    if (!canManage) return [];
    const actions: DataTableRowAction[] = [
      {
        key: "edit",
        label: "Edit",
        onClick: () => {
          setEditing(user);
          setDrawerOpen(true);
        },
      },
    ];
    // The owner cannot be deactivated, and nobody can deactivate themselves —
    // the backend enforces both; not offering them says so up front.
    const self = user.uuid === me?.uuid;
    if (user.user_type !== "owner" && !self) {
      actions.push(
        user.is_active
          ? {
              key: "deactivate",
              label: "Deactivate",
              danger: true,
              onClick: () => setPendingDeactivation(user),
            }
          : {
              key: "activate",
              label: "Activate",
              onClick: () => void setActive(user, true),
            }
      );
    }
    return actions;
  }

  function reportFailure(error: unknown, fallback: string) {
    toast({
      title: fallback,
      description: error instanceof ApiError ? error.message : "Please try again.",
      variant: "error",
    });
  }

  async function setActive(user: TenantUser, isActive: boolean) {
    try {
      await updateUser(user.uuid, { is_active: isActive });
      toast({
        title: isActive ? "User activated" : "User deactivated",
        description: `${user.full_name || user.email} can ${isActive ? "sign in again" : "no longer sign in"}.`,
        variant: "success",
      });
      setPendingDeactivation(null);
      reload();
    } catch (error) {
      reportFailure(error, "Could not update the user");
    }
  }

  async function submitForm(values: UserFormValues) {
    const target = editing;
    try {
      if (target) {
        await updateUser(target.uuid, {
          first_name: values.first_name,
          last_name: values.last_name,
          phone_number: values.phone_number,
          roles: values.roles,
        });
        toast({ title: "User updated", variant: "success" });
      } else {
        await inviteUser(values);
        toast({
          title: "Invite sent",
          description: `${values.email} can now set a password.`,
          variant: "success",
        });
      }
      setDrawerOpen(false);
      setEditing(null);
      reload();
    } catch (error) {
      reportFailure(error, target ? "Could not update the user" : "Could not invite");
      throw error; // the drawer keeps the field-level messages
    }
  }

  return (
    <div role="tabpanel" aria-label="Manage Users">
      <SettingsDetailBack onBack={onBack} />

      <DataTable
        tableId="settings-users"
        renderToolbar={({ searchFilter, pagination }) => (
          <ControlPanel
            pageActions={
              canManage ? (
                <PageActions
                  buttons={[
                    {
                      key: "invite",
                      children: "New",
                      variant: "primary",
                      size: "sm",
                      onClick: () => {
                        setEditing(null);
                        setDrawerOpen(true);
                      },
                    },
                  ]}
                />
              ) : undefined
            }
            endSlot={pagination}
          >
            {searchFilter}
          </ControlPanel>
        )}
        columns={columns}
        data={users}
        searchable
        searchPlaceholder="Search users…"
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        manualFiltering
        filters={filters}
        filtering={{
          state: filterValues,
          onChange: (next) => {
            setFilterValues(next);
            setPage(1);
          },
        }}
        sorting={{
          state: sorting,
          onChange: (next) => {
            setSorting(next);
            setPage(1);
          },
        }}
        loading={loading}
        error={error}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        emptyMessage="No users match this search."
      />

      <UserFormDrawer
        open={drawerOpen}
        user={editing}
        roles={roles}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSubmit={submitForm}
      />

      <ConfirmDialog
        open={pendingDeactivation !== null}
        title="Deactivate this user?"
        description={
          pendingDeactivation
            ? `${pendingDeactivation.full_name || pendingDeactivation.email} keeps their history but can no longer sign in. You can activate them again at any time.`
            : ""
        }
        confirmLabel="Deactivate"
        variant="danger"
        onCancel={() => setPendingDeactivation(null)}
        onConfirm={() => {
          if (pendingDeactivation) void setActive(pendingDeactivation, false);
        }}
      />
    </div>
  );
}
