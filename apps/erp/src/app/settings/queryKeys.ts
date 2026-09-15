/** React Query keys for Settings — one namespace, stable across the app. */

export const settingsKeys = {
  roles: {
    all: ["settings", "roles"] as const,
    list: () => [...settingsKeys.roles.all, "list"] as const,
    detail: (uuid: string) => [...settingsKeys.roles.all, uuid] as const,
  },
  matrix: ["settings", "permissions", "matrix"] as const,
  branches: {
    all: ["settings", "branches"] as const,
    list: () => [...settingsKeys.branches.all, "list"] as const,
    detail: (uuid: string) => [...settingsKeys.branches.all, uuid] as const,
  },
  users: {
    all: ["settings", "users"] as const,
    list: (params: Record<string, unknown>) =>
      [...settingsKeys.users.all, "list", params] as const,
    detail: (uuid: string) => [...settingsKeys.users.all, uuid] as const,
  },
  modules: {
    all: ["settings", "modules"] as const,
    list: () => [...settingsKeys.modules.all, "list"] as const,
  },
  company: {
    all: ["settings", "company"] as const,
    detail: () => [...settingsKeys.company.all, "detail"] as const,
  },
  documentLayout: {
    all: ["settings", "document-layout"] as const,
    detail: () => [...settingsKeys.documentLayout.all, "detail"] as const,
  },
} as const;

/** Kept for module-install invalidation (same key as settingsKeys.matrix). */
export const PERMISSION_MATRIX_QUERY_KEY = settingsKeys.matrix;
