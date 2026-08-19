import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ControlPanel } from "./ControlPanel";
import { PageActions } from "../PageActions";
import { SearchFilter } from "../../components/SearchFilter";

const meta = {
  title: "Layout/ControlPanel",
  component: ControlPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Three-column list toolbar: PageActions on the left, SearchFilter in the center, pagination on the right.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen w-full bg-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ControlPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

function Pager({
  start,
  end,
  total,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  start: number;
  end: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-3 text-[13px] text-erp-text">
      <span className="whitespace-nowrap tabular-nums">
        {start}-{end} / {total}
      </span>
      <div className="flex gap-0.5">
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded bg-erp-secondary text-erp-muted hover:bg-erp-secondary-hover disabled:opacity-40"
          disabled={!canPrev}
          aria-label="Previous page"
          onClick={onPrev}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded bg-erp-secondary text-erp-muted hover:bg-erp-secondary-hover disabled:opacity-40"
          disabled={!canNext}
          aria-label="Next page"
          onClick={onNext}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: function DefaultStory() {
    const [search, setSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const total = 12;
    const pageSize = 5;
    const start = pageIndex * pageSize + 1;
    const end = Math.min((pageIndex + 1) * pageSize, total);

    return (
      <ControlPanel
        pageActions={<PageActions breadcrumb="Customers" onCreate={() => undefined} />}
        endSlot={
          <Pager
            start={start}
            end={end}
            total={total}
            canPrev={pageIndex > 0}
            canNext={end < total}
            onPrev={() => setPageIndex((page) => page - 1)}
            onNext={() => setPageIndex((page) => page + 1)}
          />
        }
      >
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Search customers"
          filters={[
            { id: "active", label: "Active", onSelect: () => undefined },
            { id: "inactive", label: "Inactive", onSelect: () => undefined },
          ]}
        />
      </ControlPanel>
    );
  },
};

export const MultipleButtons: Story = {
  name: "Multiple buttons",
  render: function MultipleButtonsStory() {
    const [search, setSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const total = 12;
    const pageSize = 5;
    const start = pageIndex * pageSize + 1;
    const end = Math.min((pageIndex + 1) * pageSize, total);

    return (
      <ControlPanel
        pageActions={
          <PageActions
            breadcrumb="Customers"
            buttons={[
              {
                key: "new",
                children: "New",
                variant: "primary",
                size: "sm",
                onClick: () => undefined,
              },
              {
                key: "import",
                children: "Import",
                variant: "secondary",
                size: "sm",
                onClick: () => undefined,
              },
            ]}
          />
        }
        endSlot={
          <Pager
            start={start}
            end={end}
            total={total}
            canPrev={pageIndex > 0}
            canNext={end < total}
            onPrev={() => setPageIndex((page) => page - 1)}
            onNext={() => setPageIndex((page) => page + 1)}
          />
        }
      >
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Search customers"
          filters={[
            { id: "active", label: "Active", onSelect: () => undefined },
            { id: "inactive", label: "Inactive", onSelect: () => undefined },
          ]}
        />
      </ControlPanel>
    );
  },
};
