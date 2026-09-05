/** Invite a user, or edit one — the same fields either way, except that
 * email is the login identifier and so is set once, at invite time. */

import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Drawer,
  FormField,
  FormGrid,
  FormInput,
  FormSection,
} from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import type { TenantRole, TenantUser } from "../usersApi";

export interface UserFormValues {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  roles: string[];
}

const EMPTY: UserFormValues = {
  email: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  roles: [],
};

function valuesOf(user: TenantUser | null): UserFormValues {
  if (!user) return EMPTY;
  return {
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    phone_number: user.phone_number,
    roles: user.roles.map((role) => role.uuid),
  };
}

export interface UserFormDrawerProps {
  open: boolean;
  /** null = inviting someone new. */
  user: TenantUser | null;
  roles: TenantRole[];
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
}

export function UserFormDrawer({
  open,
  user,
  roles,
  onClose,
  onSubmit,
}: UserFormDrawerProps) {
  const [values, setValues] = useState<UserFormValues>(() => valuesOf(user));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const inviting = user === null;

  // Re-seed whenever the drawer opens on a different row.
  useEffect(() => {
    if (open) {
      setValues(valuesOf(user));
      setFieldErrors({});
    }
  }, [open, user]);

  function update<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleRole(uuid: string, checked: boolean) {
    update(
      "roles",
      checked ? [...values.roles, uuid] : values.roles.filter((held) => held !== uuid)
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      await onSubmit(values);
    } catch (error) {
      // Field-level messages come back from the serializer; anything else is
      // surfaced by the caller's toast.
      if (error instanceof ApiError && error.fields) setFieldErrors(error.fields);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={inviting ? "Invite user" : user?.full_name || user?.email}
      description={
        inviting
          ? "They receive an email to verify the address and set a password."
          : "Update their details and the roles they hold."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" variant="primary" loading={saving}>
            {inviting ? "Send invite" : "Save"}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={(event) => void handleSubmit(event)}>
        <FormSection title="Details">
          <FormGrid>
            <FormField
              label="Email"
              htmlFor="user-email"
              required={inviting}
              span={12}
              error={fieldErrors.email?.[0]}
            >
              <FormInput
                id="user-email"
                name="email"
                type="email"
                required
                // The login identifier: set once, at invite time.
                disabled={!inviting}
                value={values.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </FormField>
            <FormField label="First name" htmlFor="user-first-name" span={6}>
              <FormInput
                id="user-first-name"
                name="first_name"
                value={values.first_name}
                onChange={(event) => update("first_name", event.target.value)}
              />
            </FormField>
            <FormField label="Last name" htmlFor="user-last-name" span={6}>
              <FormInput
                id="user-last-name"
                name="last_name"
                value={values.last_name}
                onChange={(event) => update("last_name", event.target.value)}
              />
            </FormField>
            <FormField
              label="Phone"
              htmlFor="user-phone"
              span={12}
              error={fieldErrors.phone_number?.[0]}
              description="International format, e.g. +252612345678."
            >
              <FormInput
                id="user-phone"
                name="phone_number"
                type="tel"
                value={values.phone_number}
                onChange={(event) => update("phone_number", event.target.value)}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection
          title="Roles"
          description="What this user may do. The owner always holds everything."
        >
          {roles.length === 0 ? (
            <p className="m-0 px-[13px] text-[12px] text-erp-muted">
              No roles yet — create one under Settings → Roles.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 px-[13px]">
              {roles.map((role) => (
                <Checkbox
                  key={role.uuid}
                  hasHalo={false}
                  label={role.name}
                  checked={values.roles.includes(role.uuid)}
                  onChange={(event) => toggleRole(role.uuid, event.target.checked)}
                />
              ))}
            </div>
          )}
        </FormSection>
      </form>
    </Drawer>
  );
}
