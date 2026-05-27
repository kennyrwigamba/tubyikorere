import type { ComponentProps, ReactNode } from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { SidebarBrand, SidebarNavItem, SidebarUser } from "@/lib/types/nav";
import { cn } from "@/lib/utils";

export type AppSidebarProps = {
  brand: SidebarBrand;
  user: SidebarUser;
  navItems: SidebarNavItem[];
  navLabel?: string;
  footer?: ReactNode;
} & ComponentProps<typeof Sidebar>;

function SidebarBrand({ brand }: { brand: SidebarBrand }) {
  const BrandIcon = brand.icon;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="pointer-events-none bg-transparent hover:bg-transparent"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrandIcon className="size-4" aria-hidden />
          </div>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{brand.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {brand.subtitle}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** App sidebar — same surface as navbar/cards, prop-driven navigation. */
export function AppSidebar({
  brand,
  user,
  navItems,
  navLabel = "Menu",
  footer,
  className,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="icon"
      className={cn("border-r border-sidebar-border bg-sidebar", className)}
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarBrand brand={brand} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} groupLabel={navLabel} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {footer ?? <NavUser user={{ ...user, avatar: user.avatar ?? "" }} />}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
