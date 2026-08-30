export type TrialApp = {
  id: string;
  labelKey: `apps.${string}`;
  kind: string;
};

export type TrialCategory = {
  id: string;
  labelKey: `categories.${string}`;
  apps: TrialApp[];
};

/** Full trial catalog — layout matches Odoo trial picker categories. */
export const TRIAL_CATEGORIES: TrialCategory[] = [
  {
    id: "website",
    labelKey: "categories.website",
    apps: [
      { id: "website", labelKey: "apps.website", kind: "website" },
      { id: "ecommerce", labelKey: "apps.ecommerce", kind: "commerce" },
      { id: "blog", labelKey: "apps.blog", kind: "documents" },
      { id: "forum", labelKey: "apps.forum", kind: "discuss" },
      { id: "elearning", labelKey: "apps.elearning", kind: "knowledge" },
      { id: "events", labelKey: "apps.events", kind: "project" },
    ],
  },
  {
    id: "sales",
    labelKey: "categories.sales",
    apps: [
      { id: "crm", labelKey: "apps.crm", kind: "crm" },
      { id: "sales", labelKey: "apps.sales", kind: "sales" },
      { id: "pos", labelKey: "apps.pos", kind: "pos" },
      { id: "restaurant", labelKey: "apps.restaurant", kind: "pos" },
      { id: "subscriptions", labelKey: "apps.subscriptions", kind: "subscriptions" },
      { id: "rental", labelKey: "apps.rental", kind: "commerce" },
    ],
  },
  {
    id: "finance",
    labelKey: "categories.finance",
    apps: [
      { id: "invoicing", labelKey: "apps.invoicing", kind: "accounting" },
      { id: "accounting", labelKey: "apps.accounting", kind: "accounting" },
      { id: "expenses", labelKey: "apps.expenses", kind: "documents" },
      { id: "sign", labelKey: "apps.sign", kind: "sign" },
      { id: "equity", labelKey: "apps.equity", kind: "project" },
      { id: "esg", labelKey: "apps.esg", kind: "dashboard" },
    ],
  },
  {
    id: "services",
    labelKey: "categories.services",
    apps: [
      { id: "project", labelKey: "apps.project", kind: "project" },
      { id: "timesheets", labelKey: "apps.timesheets", kind: "timesheets" },
      { id: "field-service", labelKey: "apps.fieldService", kind: "field" },
      { id: "helpdesk", labelKey: "apps.helpdesk", kind: "helpdesk" },
      { id: "appointments", labelKey: "apps.appointments", kind: "calendar" },
      { id: "planning", labelKey: "apps.planning", kind: "planning" },
    ],
  },
  {
    id: "productivity",
    labelKey: "categories.productivity",
    apps: [
      { id: "documents", labelKey: "apps.documents", kind: "documents" },
      { id: "approvals", labelKey: "apps.approvals", kind: "sign" },
      { id: "knowledge", labelKey: "apps.knowledge", kind: "knowledge" },
    ],
  },
  {
    id: "supply-chain",
    labelKey: "categories.supplyChain",
    apps: [
      { id: "inventory", labelKey: "apps.inventory", kind: "inventory" },
      { id: "manufacturing", labelKey: "apps.manufacturing", kind: "manufacturing" },
      { id: "purchase", labelKey: "apps.purchase", kind: "purchase" },
      { id: "maintenance", labelKey: "apps.maintenance", kind: "maintenance" },
      { id: "quality", labelKey: "apps.quality", kind: "quality" },
      { id: "repair", labelKey: "apps.repair", kind: "repair" },
    ],
  },
  {
    id: "marketing",
    labelKey: "categories.marketing",
    apps: [
      { id: "email-marketing", labelKey: "apps.emailMarketing", kind: "email" },
      { id: "sms-marketing", labelKey: "apps.smsMarketing", kind: "discuss" },
      { id: "survey", labelKey: "apps.survey", kind: "documents" },
      { id: "social-marketing", labelKey: "apps.socialMarketing", kind: "social" },
    ],
  },
  {
    id: "hr",
    labelKey: "categories.hr",
    apps: [
      { id: "employees", labelKey: "apps.employees", kind: "hr" },
      { id: "attendances", labelKey: "apps.attendances", kind: "timesheets" },
      { id: "recruitment", labelKey: "apps.recruitment", kind: "crm" },
      { id: "time-off", labelKey: "apps.timeOff", kind: "calendar" },
      { id: "appraisals", labelKey: "apps.appraisals", kind: "project" },
      { id: "fleet", labelKey: "apps.fleet", kind: "fleet" },
      { id: "payroll", labelKey: "apps.payroll", kind: "accounting" },
    ],
  },
  {
    id: "customizations",
    labelKey: "categories.customizations",
    apps: [{ id: "studio", labelKey: "apps.studio", kind: "studio" }],
  },
];

export const TRIAL_APPS = TRIAL_CATEGORIES.flatMap((category) => category.apps);
