import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { AppShell, useNavbarDefaults } from "@/app";
import { inventorySubmenu } from "@/modules/inventory/manifest";
import {
  Button,
  ConfirmDialog,
  ControlPanel,
  DataTable,
  Drawer,
  PageActions,
  StatusBadge,
  formatCurrency,
  useDebounce,
  useToast,
  type DataTableFilter,
  type DataTableFilterValues,
} from "@erp/ui";
import {
  useDeleteProductMutation,
  useProductsQuery,
  type Product,
} from "@/modules/inventory/api";
import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
  type ProductStatus,
} from "@/modules/inventory/data/demo-products";
import { MockApiError } from "@/lib/mock";

export default function ProductsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<DataTableFilterValues>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const statusFilter = String(filterValues.status ?? "");
  const categoryFilter = String(filterValues.category ?? "");

  const status: ProductStatus | "all" =
    statusFilter === "Active" ||
    statusFilter === "Inactive" ||
    statusFilter === "Discontinued"
      ? statusFilter
      : "all";

  const category: ProductCategory | "all" = PRODUCT_CATEGORIES.includes(
    categoryFilter as ProductCategory
  )
    ? (categoryFilter as ProductCategory)
    : "all";

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      status,
      category,
      page,
      pageSize,
    }),
    [debouncedSearch, status, category, page, pageSize]
  );

  const productsQuery = useProductsQuery(listParams);
  const deleteMutation = useDeleteProductMutation();

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        placeholder: "All statuses",
        options: [
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
          { label: "Discontinued", value: "Discontinued" },
        ],
      },
      {
        key: "category",
        label: "Category",
        type: "select",
        placeholder: "All categories",
        options: PRODUCT_CATEGORIES.map((value) => ({
          label: value,
          value,
        })),
      },
    ],
    []
  );

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "sku",
        header: "SKU",
        // size: 110,
      },
      {
        accessorKey: "name",
        header: "Product",
        // meta: { fill: true },
        size: 220,
        cell: ({ row, getValue }) => (
          <button
            type="button"
            className="font-bold text-[#2E5FA7] hover:underline"
            onClick={() => setDetailProduct(row.original)}
          >
            {String(getValue())}
          </button>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        // size: 130,
      },
      {
        accessorKey: "unit",
        header: "Unit",
        // size: 70,
      },
      {
        accessorKey: "unitPrice",
        header: "Unit price",
        // size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatCurrency(Number(getValue()))}</span>
        ),
      },
      {
        accessorKey: "stockQty",
        header: "Stock",
        // size: 80,
        cell: ({ row, getValue }) => {
          const qty = Number(getValue());
          const low = qty <= row.original.reorderLevel;
          return (
            <span
              className={low ? "font-bold tabular-nums text-erp-error" : "tabular-nums"}
            >
              {qty}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
        // size: 120,
      },
    ],
    []
  );

  async function confirmDelete() {
    try {
      for (const id of pendingDeleteIds) {
        await deleteMutation.mutateAsync(id);
      }
      toast({
        title: pendingDeleteIds.length > 1 ? "Products deleted" : "Product deleted",
        description: `${pendingDeleteIds.length} record(s) removed.`,
        variant: "success",
      });
      setPendingDeleteIds([]);
      setDetailProduct(null);
    } catch (error) {
      const message =
        error instanceof MockApiError ? error.message : "Could not delete product.";
      toast({ title: "Delete failed", description: message, variant: "error" });
    }
  }

  const navbar = useNavbarDefaults({
    brandLabel: "Products",
    submenuItems: inventorySubmenu,
    submenuActiveKey: "products",
  });

  return (
    <AppShell activeNavKey="inventory" activeMobileKey="tasks" navbar={navbar}>
      <DataTable
        tableId="inventory-products"
        renderToolbar={({ searchFilter, pagination, bulkActions }) => (
          <ControlPanel
            pageActions={
              <PageActions
                title="Products"
                onCreate={() => navigate("/inventory/products/new")}
              />
            }
            endSlot={pagination}
          >
            {bulkActions ?? searchFilter}
          </ControlPanel>
        )}
        columns={columns}
        data={productsQuery.data?.data ?? []}
        searchable
        searchPlaceholder="Search SKU, name, barcode…"
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
        selectable
        loading={productsQuery.isLoading || productsQuery.isFetching}
        error={
          productsQuery.isError
            ? productsQuery.error.message || "Failed to load products"
            : null
        }
        getRowId={(row) => row.id}
        pagination={{
          page,
          pageSize,
          total: productsQuery.data?.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        bulkActions={[
          {
            key: "delete",
            label: "Delete",
            variant: "danger",
            onClick: (rows) => setPendingDeleteIds(rows.map((row) => row.id)),
          },
          {
            key: "export",
            label: "Export",
            variant: "danger",
            onClick: (rows) => setPendingDeleteIds(rows.map((row) => row.id)),
          },
        ]}
        emptyMessage="No products found. Try adjusting filters or create a new product."
      />

      <ConfirmDialog
        open={pendingDeleteIds.length > 0}
        title={
          pendingDeleteIds.length > 1 ? "Delete selected products?" : "Delete product?"
        }
        description="This mock action removes records from the in-memory store."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDeleteIds([])}
        onConfirm={() => void confirmDelete()}
      />

      <Drawer
        open={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        title={detailProduct?.name}
        description={detailProduct?.sku}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailProduct(null)}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (detailProduct) {
                  navigate(`/inventory/products/${detailProduct.id}/edit`);
                }
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (detailProduct) {
                  setPendingDeleteIds([detailProduct.id]);
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {detailProduct ? (
          <dl className="m-0 grid gap-2 text-[12px]">
            <div>
              <dt className="text-erp-subtle">Category</dt>
              <dd className="m-0 font-bold text-erp-text">{detailProduct.category}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Unit</dt>
              <dd className="m-0 font-bold text-erp-text">{detailProduct.unit}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Unit price</dt>
              <dd className="m-0 font-bold text-erp-text">
                {formatCurrency(detailProduct.unitPrice)}
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Cost price</dt>
              <dd className="m-0 font-bold text-erp-text">
                {formatCurrency(detailProduct.costPrice)}
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Stock / reorder</dt>
              <dd className="m-0 font-bold text-erp-text">
                {detailProduct.stockQty} / {detailProduct.reorderLevel}
              </dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Status</dt>
              <dd className="m-0 mt-1">
                <StatusBadge status={detailProduct.status} />
              </dd>
            </div>
            {detailProduct.barcode ? (
              <div>
                <dt className="text-erp-subtle">Barcode</dt>
                <dd className="m-0 font-bold text-erp-text">{detailProduct.barcode}</dd>
              </div>
            ) : null}
            {detailProduct.description ? (
              <div>
                <dt className="text-erp-subtle">Description</dt>
                <dd className="m-0 text-erp-text">{detailProduct.description}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-erp-subtle">Created</dt>
              <dd className="m-0 font-bold text-erp-text">{detailProduct.created}</dd>
            </div>
            <div>
              <dt className="text-erp-subtle">Updated</dt>
              <dd className="m-0 font-bold text-erp-text">{detailProduct.updated}</dd>
            </div>
            <p className="m-0 mt-2 text-[11px] text-erp-muted">
              Need a new record?{" "}
              <Link
                to="/inventory/products/new"
                className="font-bold text-erp-blue hover:underline"
              >
                Create product
              </Link>
            </p>
          </dl>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
