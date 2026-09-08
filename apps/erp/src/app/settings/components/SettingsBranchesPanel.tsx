/**
 * Settings → Users → Manage Branches.
 *
 * The tenant's shops and offices over `/api/v1/branches/`: a handful of
 * rows, so the table is filled client-side. The default branch cannot be
 * deleted or archived, and one with staff on it is archived rather than
 * deleted, so those actions are simply not offered for it.
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
import {
  BRANCH_CODES,
  deleteBranch,
  updateBranch,
  useBranches,
  type Branch,
} from "../branchesApi";
import { useCurrentUser } from "../usersApi";

export function SettingsBranchesPanel({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const me = useCurrentUser();
  const { branches, loading, error, reload } = useBranches();
  const [pendingDelete, setPendingDelete] = useState<Branch | null>(null);

  const held = me?.permissions ?? [];
  const canCreate = held.includes(BRANCH_CODES.create);
  const canEdit = held.includes(BRANCH_CODES.edit);
  const canDelete = held.includes(BRANCH_CODES.delete);

  const columns = useMemo<ColumnDef<Branch>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Branch",
        meta: { fill: true },
        size: 200,
        cell: ({ row }) => {
          const branch = row.original;
          return canEdit ? (
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
              onClick={() => navigate(`/settings/branches/${branch.uuid}`)}
            >
              {branch.name}
            </button>
          ) : (
            <span>{branch.name}</span>
          );
        },
      },
      { accessorKey: "code", header: "Code", size: 90 },
      {
        id: "location",
        header: "Location",
        enableSorting: false,
        size: 180,
        cell: ({ row }) => {
          const { city, country } = row.original;
          return [city, country].filter(Boolean).join(", ") || "—";
        },
      },
      { accessorKey: "user_count", header: "Users", size: 80 },
      {
        id: "status",
        header: "Status",
        size: 120,
        cell: ({ row }) => {
          const branch = row.original;
          if (branch.is_archived) return <StatusBadge status="Archived" />;
          return <StatusBadge status={branch.is_default ? "Default" : "Active"} />;
        },
      },
    ],
    [canEdit, navigate]
  );

  /** Only the actions this viewer may actually perform are offered. */
  function rowActions(branch: Branch): DataTableRowAction[] {
    const actions: DataTableRowAction[] = [];
    if (canEdit) {
      actions.push({
        key: "edit",
        label: "Edit",
        onClick: () => navigate(`/settings/branches/${branch.uuid}`),
      });
      // The default cannot be demoted on its own; promoting another is what
      // moves the flag, so that is the only control offered.
      if (!branch.is_default && !branch.is_archived) {
        actions.push({
          key: "default",
          label: "Make default",
          onClick: () => void promote(branch),
        });
      }
      if (!branch.is_default) {
        actions.push({
          key: "archive",
          label: branch.is_archived ? "Restore" : "Archive",
          onClick: () => void setArchived(branch, !branch.is_archived),
        });
      }
    }
    // The backend refuses both cases below; not offering them says so.
    if (canDelete && !branch.is_default && branch.user_count === 0) {
      actions.push({
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => setPendingDelete(branch),
      });
    }
    return actions;
  }

  function reportFailure(err: unknown, fallback: string) {
    toast({
      title: fallback,
      description: err instanceof ApiError ? err.message : "Please try again.",
      variant: "error",
    });
  }

  async function promote(branch: Branch) {
    try {
      await updateBranch(branch.uuid, { is_default: true });
      toast({
        title: "Default branch changed",
        description: `${branch.name} is now the default.`,
        variant: "success",
      });
      reload();
    } catch (err) {
      reportFailure(err, "Could not change the default branch");
    }
  }

  async function setArchived(branch: Branch, isArchived: boolean) {
    try {
      await updateBranch(branch.uuid, { is_archived: isArchived });
      toast({
        title: isArchived ? "Branch archived" : "Branch restored",
        variant: "success",
      });
      reload();
    } catch (err) {
      reportFailure(err, "Could not update the branch");
    }
  }

  async function remove(branch: Branch) {
    try {
      await deleteBranch(branch.uuid);
      toast({ title: "Branch deleted", variant: "success" });
      setPendingDelete(null);
      reload();
    } catch (err) {
      reportFailure(err, "Could not delete the branch");
    }
  }

  return (
    <div role="tabpanel" aria-label="Manage Branches">
      <SettingsDetailBack onBack={onBack} />

      <DataTable
        tableId="settings-branches"
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
                      onClick: () => navigate("/settings/branches/new"),
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
        data={branches}
        searchable
        searchPlaceholder="Search branches…"
        loading={loading}
        error={error}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={false}
        emptyMessage="No branches yet."
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this branch?"
        description={
          pendingDelete
            ? `${pendingDelete.name} has no users on it and will be removed. Archive it instead if you may need it on old documents.`
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
