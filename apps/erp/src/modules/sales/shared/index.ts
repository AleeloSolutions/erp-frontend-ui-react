/**
 * Cross-entity plumbing: list transport and the tenant configuration more
 * than one document type reads. Not a public module surface — entities
 * import from here, the application does not.
 */
export * from "./api";
export * from "./queries";
export * from "./permissions";
export { DRAFT_ROW_CLASS_NAME, draftRowClassNameWhen } from "./draftRowClassName";
