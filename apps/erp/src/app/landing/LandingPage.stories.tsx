import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/lib/i18n";
import LandingPage from "./LandingPage";

const meta = {
  title: "Pages/Marketing Landing",
  component: LandingPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div className="!m-0 !min-h-0 !bg-transparent !p-0">
            <Story />
          </div>
        </MemoryRouter>
      </I18nextProvider>
    ),
  ],
} satisfies Meta<typeof LandingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
