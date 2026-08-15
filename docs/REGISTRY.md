# @erp/ui Component Status Registry

**Owner:** Management (status) · UI team (implementation)  
**Statuses:** `Proposed` → `Spec approved` → `In progress` → `In review` → `Approved` → `Deprecated`

Until Gates 1–5 are fully active, components listed as **In progress (pre-Approved)** may be used by modules. They are **not** API-frozen.

| Component | Layer | Status | Owner | Notes |
|-----------|-------|--------|-------|-------|
| Button | Primitive | In progress (pre-Approved) | UI | Grandfathered `loading` prop |
| Input | Primitive | In progress (pre-Approved) | UI | Prefer `FormField` for label |
| Textarea | Primitive | In progress (pre-Approved) | UI | |
| Select | Primitive | In progress (pre-Approved) | UI | Native `<select>`; ERP Select TBD |
| Checkbox | Primitive | In progress (pre-Approved) | UI | |
| Radio | Primitive | In progress (pre-Approved) | UI | |
| Switch | Primitive | In progress (pre-Approved) | UI | |
| DatePicker | Primitive | In progress (pre-Approved) | UI | Native `type="date"`; full picker TBD |
| Badge | Primitive | In progress (pre-Approved) | UI | |
| StatusBadge | Primitive | In progress (pre-Approved) | UI | Domain status map — refactor toward variants |
| Card | Primitive | In progress (pre-Approved) | UI | |
| Tooltip | Primitive | In progress (pre-Approved) | UI | |
| DataTable | Composite | In progress (pre-Approved) | UI | Gap series vs standards §6.3 |
| FilterBar | Composite | In progress (pre-Approved) | UI | Currently re-exports table filters |
| FormShell / FormField / … | Composite | In progress (pre-Approved) | UI | App owns RHF |
| Modal | Composite | In progress (pre-Approved) | UI | Grandfathered `open`; portal/trap TBD |
| ConfirmDialog | Composite | In progress (pre-Approved) | UI | |
| Drawer | Composite | In progress (pre-Approved) | UI | |
| Dropdown | Composite | In progress (pre-Approved) | UI | |
| Toast | Composite | In progress (pre-Approved) | UI | |
| AppShell | Layout | In progress (pre-Approved) | UI | |
| Sidebar | Layout | In progress (pre-Approved) | UI | Router coupling debt |
| Header / PageHeader | Layout | In progress (pre-Approved) | UI | |
| PageContainer | Layout | In progress (pre-Approved) | UI | |
| PageSubmenu | Layout | In progress (pre-Approved) | UI | Router coupling debt |
| MobileNav | Layout | In progress (pre-Approved) | UI | Router coupling debt |

### Proposed (not started)

| Component | Layer | Status | Notes |
|-----------|-------|--------|-------|
| IconButton | Primitive | Proposed | |
| SearchInput | Primitive | Proposed | |
| Avatar | Primitive | Proposed | |
| EmptyState | Composite | Proposed | |
| Tabs | Composite | Proposed | |
| Breadcrumbs | Layout | Proposed | |
| useFilterParams | Hook | Proposed | URL sync for filters |

Update this table when a component moves status or is released.
