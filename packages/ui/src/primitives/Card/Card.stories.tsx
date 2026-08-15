import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./Card";
import { Button } from "../Button";

const meta = {
  title: "Primitives/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Customer summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="m-0 text-[12px] text-erp-muted">
          Open balance, last invoice, and recent activity.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="primary" size="sm">
          View
        </Button>
      </CardFooter>
    </Card>
  ),
};
