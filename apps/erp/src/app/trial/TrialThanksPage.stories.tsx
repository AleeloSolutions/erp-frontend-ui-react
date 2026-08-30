import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/lib/i18n";
import TrialThanksPage from "./TrialThanksPage";

const meta = {
  title: "Pages/Trial Thanks",
  component: TrialThanksPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <MemoryRouter
          initialEntries={[
            { pathname: "/thanks/trial", state: { apps: ["Accounting"] } },
          ]}
        >
          <Routes>
            <Route path="/thanks/trial" element={<Story />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    ),
  ],
} satisfies Meta<typeof TrialThanksPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
