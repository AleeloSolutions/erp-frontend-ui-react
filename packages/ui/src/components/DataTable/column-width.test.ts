import type { ColumnSizingState } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";
import { applyBorderResize, type DonorColumn } from "./column-width";

/**
 * Mirrors how DataTable.tsx resolves column bounds for data columns that
 * only set `size` (e.g. CustomersPage's Customer/Email/Test columns) — no
 * explicit minSize/maxSize, so the DEFAULT_COLUMN_MIN/MAX_SIZE fallback
 * (44 / 640) applies.
 */
const MIN = 44;
const MAX = 640;
const col = (id: string): DonorColumn => ({ id, min: MIN, max: MAX });

describe("applyBorderResize", () => {
  it("growing the right side of a border cascades past an exhausted immediate-left neighbor", () => {
    // customer:220, email:200, test:120 — same shape as CustomersPage.tsx.
    let sizing: ColumnSizingState = { customer: 220, email: 200, test: 120 };

    // Drag the customer/email border to grow customer, draining email all
    // the way to its floor (leftChain=[customer], rightChain=[email, test]).
    sizing = applyBorderResize(
      sizing,
      [col("customer")],
      [col("email"), col("test")],
      156
    );
    expect(sizing).toEqual({ customer: 376, email: MIN, test: 120 });

    // Now drag the email/test border the other way, growing test. The
    // immediate left neighbor (email) is pinned at its floor with nothing
    // to give — before this fix, that stranded the drag entirely. It must
    // now cascade further left, past email, into customer.
    const next = applyBorderResize(
      sizing,
      [col("email"), col("customer")],
      [col("test")],
      -100
    );

    expect(next.test).toBe(220); // grew by the full 100
    expect(next.email).toBe(MIN); // pinned neighbor untouched
    expect(next.customer).toBe(276); // cascaded past email into customer
  });

  it("growing the left side of a border still cascades past an exhausted immediate-right neighbor", () => {
    let sizing: ColumnSizingState = { email: 200, test: 120, phone: 120 };

    // Drag test/phone to grow phone, draining test to its floor.
    sizing = applyBorderResize(sizing, [col("test")], [col("phone")], -76);
    expect(sizing).toEqual({ email: 200, test: MIN, phone: 196 });

    // Drag email/test to grow email. test (immediate right neighbor) is
    // pinned at its floor, so this must cascade into phone.
    const next = applyBorderResize(
      sizing,
      [col("email")],
      [col("test"), col("phone")],
      120
    );

    expect(next.email).toBe(320);
    expect(next.test).toBe(MIN);
    expect(next.phone).toBe(76); // cascaded past test into phone
  });

  it("stops growing once every donor on both sides is exhausted", () => {
    const sizing = { email: 200, test: MIN, phone: MIN };

    const next = applyBorderResize(
      sizing,
      [col("email")],
      [col("test"), col("phone")],
      500
    );

    expect(next).toEqual(sizing);
  });
});
