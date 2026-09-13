/**
 * Smart quantity range buckets from a tenant's movement min/max.
 *
 * Uses "nice" steps (1, 2, 5 × 10^n). Values are `min..max` / `min..`
 * strings the movements API understands.
 */

export type QuantityBucket = { label: string; value: string };

function niceStep(rough: number): number {
  if (!(rough > 0) || !Number.isFinite(rough)) return 1;
  const exp = Math.floor(Math.log10(rough));
  const base = 10 ** Math.max(exp, 0);
  const fraction = rough / (10 ** exp);
  let nice: number;
  if (fraction <= 1.5) nice = 1;
  else if (fraction <= 3) nice = 2;
  else if (fraction <= 7) nice = 5;
  else nice = 10;
  return nice * (10 ** exp);
}

function formatQty(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 1000) / 1000);
}

/** Build a few inclusive quantity ranges covering [min, max]. */
export function buildQuantityBuckets(
  minRaw: string | number | null | undefined,
  maxRaw: string | number | null | undefined
): QuantityBucket[] {
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return [];

  if (max === min) {
    const v = formatQty(min);
    return [{ label: v, value: `${v}..${v}` }];
  }

  const step = niceStep((max - min) / 4);
  const buckets: QuantityBucket[] = [];
  let lo = min;

  while (lo < max && buckets.length < 5) {
    const next = lo + step;
    const isLast = next >= max || buckets.length === 4;
    const loLabel = formatQty(lo);
    if (isLast) {
      buckets.push({ label: `${loLabel}+`, value: `${loLabel}..` });
      break;
    }
    const hiLabel = formatQty(next);
    buckets.push({
      label: `${loLabel} – ${hiLabel}`,
      value: `${loLabel}..${hiLabel}`,
    });
    lo = next;
  }

  return buckets;
}
