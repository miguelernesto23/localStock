import { LogOut, MoreVertical, User } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LogoutAction } from "@/action/auth/logout.action";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function SidebarUser() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-2">
          <SidebarMenuButton className="h-auto flex-1 py-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">
                  {user.name}
                </span>

                <span className="truncate text-xs text-muted-foreground">
                  @{user.user_name}
                </span>
              </div>
            </div>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-accent"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Abrir menú de usuario</span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="end" className="w-48">
              <DropdownMenuItem asChild>
                <form action={LogoutAction} className="w-full">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
