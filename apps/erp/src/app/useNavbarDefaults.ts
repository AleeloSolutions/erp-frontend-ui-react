import { useNavigate } from "react-router-dom";
import type { NavbarProps } from "@erp/ui";
import { displayName, roleLabel, signOut, useSession } from "./session";

/** Shared user/session defaults for the Navbar. Pages override brandLabel/submenu. */
export function useNavbarDefaults(overrides?: Partial<NavbarProps>): NavbarProps {
  const navigate = useNavigate();
  const session = useSession();

  return {
    brandLabel: "ERP",
    onHomeClick: () => navigate("/"),
    // Whoever is actually signed in -- this used to read "Admin User" for
    // everybody, which made a member look like an administrator.
    userName: roleLabel(session) || "Signed in",
    userFullName: displayName(session),
    userDatabase: session?.client?.slug ?? "",
    userOnline: true,
    userMenuItems: [
      { key: "logout", label: "Log out", danger: true, onClick: () => void signOut() },
    ],
    ...overrides,
  };
}
