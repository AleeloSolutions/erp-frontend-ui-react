import type { Meta, StoryObj } from "@storybook/react";
import { PageContainer } from "./PageContainer";

const meta = {
  title: "Layout/PageContainer",
  component: PageContainer,
  args: {
    children: (
      <div className="rounded-lg border border-dashed border-erp-border bg-white p-4 text-[12px] text-erp-muted">
        Page content
      </div>
    ),
  },
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
