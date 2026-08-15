import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("uses i18n defaults for confirm and cancel", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <ConfirmDialog
          open
          title="Delete?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </I18nextProvider>
    );

    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
