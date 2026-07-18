import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export type User = {
  name: string;
  email: string;
  avatar: string;
};

export type Team = {
  name: string;
  logo: LucideIcon;
  plan: string;
};

type BaseNavItem = {
  title: string;
  badge?: string;
  disabled?: boolean;
  icon?: ComponentType<{ className?: string; strokeWidth?: string | number }>;
};

export type NavLink = BaseNavItem & {
  url: string;
  items?: never;
};

export type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: string })[];
  url?: never;
};

export type NavItem = NavCollapsible | NavLink;

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export type SidebarData = {
  user: User;
  teams: Team[];
  navGroups: NavGroup[];
};
