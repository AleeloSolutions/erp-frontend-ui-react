/** Customers: the slice's public surface. Pages stay private to `routes`. */
export { customerRoutes } from "./routes";
export { customerKeys } from "./queries";
export * from "./queries";
export type { Customer, CustomerInput, CustomerType } from "./api";
