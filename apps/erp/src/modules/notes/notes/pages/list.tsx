import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ConfirmDialog,
  ControlPanel,
  DataTable,
  PageActions,
  useToast,
  type DataTableRowAction,
} from "@erp/ui";
import { AppShell, useNavbarDefaults } from "@/app";
import { ApiError } from "@/lib/api-client";
import { useSession } from "@/app/session";
import { notesNavbar } from "../../manifest";
import type { Note } from "../api";
import { useDeleteNoteMutation, useNotesQuery } from "../queries";

function holdsAny(codes: string[] | undefined, resource: string, verb: string): boolean {
  if (!codes) return true;
  return [
    `${resource}.${verb}`,
    `${resource}.${verb}_branch`,
    `${resource}.${verb}_own`,
  ].some((code) => codes.includes(code));
}

export default function NotesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const navbar = useNavbarDefaults({ ...notesNavbar, submenuActiveKey: "all" });
  const session = useSession();
  const notes = useNotesQuery();
  const deleteMutation = useDeleteNoteMutation();
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  const canCreate = holdsAny(session?.permissions, "notes.note", "create");
  const canDelete = holdsAny(session?.permissions, "notes.note", "delete");

  const columns = useMemo<ColumnDef<Note>[]>(
    () => [
      { accessorKey: "title", header: "Title", meta: { fill: true }, size: 280 },
      {
        id: "body",
        header: "Body",
        meta: { fill: true },
        size: 360,
        cell: ({ row }) => {
          const text = row.original.body.trim();
          if (!text) return "—";
          return text.length > 80 ? `${text.slice(0, 80)}…` : text;
        },
      },
      {
        id: "branch",
        header: "Branch",
        size: 120,
        cell: ({ row }) => row.original.branch.code,
      },
      {
        id: "created_at",
        header: "Created",
        size: 170,
        cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
      },
    ],
    []
  );

  function rowActions(note: Note): DataTableRowAction[] {
    if (!canDelete) return [];
    return [
      {
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => setPendingDelete(note),
      },
    ];
  }

  return (
    <AppShell activeNavKey="notes" navbar={navbar}>
      <DataTable
        tableId="notes-notes"
        renderToolbar={({ searchFilter }) => (
          <ControlPanel
            pageActions={
              canCreate ? (
                <PageActions
                  buttons={[
                    {
                      key: "new",
                      children: "New note",
                      variant: "primary",
                      size: "sm",
                      onClick: () => navigate("/notes/new"),
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
        data={notes.data ?? []}
        searchable
        searchPlaceholder="Search notes…"
        loading={notes.isPending}
        error={notes.error ? notes.error.message : null}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={false}
        emptyMessage="No notes yet."
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete ? `Delete “${pendingDelete.title}”?` : "Delete note?"}
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteMutation.mutate(pendingDelete.uuid, {
            onSuccess: () => {
              toast({ title: "Note deleted", variant: "success" });
              setPendingDelete(null);
            },
            onError: (error: unknown) => {
              toast({
                title: "Could not delete the note",
                description:
                  error instanceof ApiError ? error.message : "Please try again.",
                variant: "error",
              });
            },
          });
        }}
      />
    </AppShell>
  );
}
