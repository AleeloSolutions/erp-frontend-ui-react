import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { QueryProvider } from "@/app/QueryProvider";
import { ToastProvider } from "@erp/ui";
import { ModuleRegistryProvider } from "@/modules";
import { i18n } from "@/lib/i18n";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryProvider>
        <ToastProvider>
          <ModuleRegistryProvider>{children}</ModuleRegistryProvider>
        </ToastProvider>
      </QueryProvider>
    </I18nextProvider>
  );
}
