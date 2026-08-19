import { useNavigate } from "react-router-dom";
import type { NavbarProps } from "@erp/ui";

/** Shared user/session defaults for the Navbar. Pages override brandLabel/submenu. */
export function useNavbarDefaults(overrides?: Partial<NavbarProps>): NavbarProps {
  const navigate = useNavigate();
  return {
    brandLabel: "ERP",
    onHomeClick: () => navigate("/"),
    userName: "Admin",
    userFullName: "Admin User",
    userDatabase: "erp-dev",
    userOnline: true,
    ...overrides,
  };
}
