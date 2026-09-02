import { Card, CardContent } from "@erp/ui";
import { platformOrigin } from "@/lib/tenant";

/** Shown when the current subdomain doesn't map to any real, active
 * tenant. Deliberately generic -- never hints that other tenants exist. */
export function WorkspaceNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-erp-bg px-4 text-erp-text">
      <a
        className="mb-6 text-[1.9375rem] font-bold leading-none tracking-[-0.1875rem] text-erp-subtle no-underline"
        href={platformOrigin()}
        aria-label="ERP home"
      >
        <span className="text-nav">e</span>rp
      </a>

      <Card className="w-full max-w-[400px]">
        <CardContent className="p-5 text-center">
          <h1 className="mb-1 text-lg font-bold">Workspace not found</h1>
          <p className="mb-4 text-[12px] text-erp-muted">
            This address doesn&apos;t match a workspace. Check the link, or sign in from
            the main site.
          </p>
          <a
            className="text-[12px] font-bold text-erp-blue hover:underline"
            href={platformOrigin()}
          >
            Go to the main site
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
