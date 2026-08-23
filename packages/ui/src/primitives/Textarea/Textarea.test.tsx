import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Textarea } from "./Textarea";

describe("Textarea autoGrow", () => {
  it("forwards the ref to the real textarea element (not just its own internal measuring ref)", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea autoGrow ref={ref} value="hello" onChange={() => {}} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current?.value).toBe("hello");
  });

  it("renders a single real textarea element, no wrapper mirror node", () => {
    render(<Textarea autoGrow value={"line one\nline two"} onChange={() => {}} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.parentElement?.hasAttribute("data-replicated-value")).toBe(false);
  });

  it("does not crash when value is empty or undefined", () => {
    const { rerender } = render(<Textarea autoGrow value="" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    rerender(<Textarea autoGrow onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("omits data-size so the global fixed-height single-line rule (line-height: 2.25rem) can't stretch its line spacing", () => {
    render(<Textarea autoGrow value="a" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).not.toHaveAttribute("data-size");
  });

  it("non-autoGrow textareas keep data-size (unaffected by the fix)", () => {
    render(<Textarea value="a" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("data-size", "sm");
  });
});
