import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("disables while loading", () => {
    render(
      <Button loading variant="primary">
        Save
      </Button>
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
