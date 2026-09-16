/** Sales: the slice's public surface. Pages stay private to `routes`. */
export { saleRoutes } from "./routes";
export { saleKeys } from "./queries";
export * from "./queries";
export type {
  Sale,
  SaleInput,
  SaleLine,
  SaleLineInput,
  SaleStatus,
  LineKind,
} from "./api";
