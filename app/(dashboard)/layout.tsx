import Link from "next/link";
import {
  Home,
  Box,
  DollarSign,
  Tag,
  WalletCards,
  ShoppingCart,
  Calculator,
  ShoppingBag,
  HandCoins,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarUser } from "@/components/dashboard/sidebar-user";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={1}>
      <SidebarProvider defaultOpen className="">
        <div className="flex min-h-screen w-full">
          <Sidebar>
            <SidebarContent>
              <SidebarGroup>
                <div className="flex items-center text-lg  p-2">
                  <Box className="h-6 w-6 animate-pulse text-primary" />
                  <SidebarGroupLabel>LocalStock</SidebarGroupLabel>
                </div>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/">
                          <Home className="mr-2 h-4 w-4" /> Dashboard
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/products">
                          <Box className="mr-2 h-4 w-4" /> Productos
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/purchases">
                          <ShoppingCart className="mr-2 h-4 w-4" /> Compras
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/sales">
                          <DollarSign className="mr-2 h-4 w-4" /> Ventas
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/capital">
                          <WalletCards className="mr-2 h-4 w-4" /> Capital
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/category">
                          <Tag className="mr-2 h-4 w-4" /> Categorías
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/debts">
                          <HandCoins className="mr-2 h-4 w-4" /> Deudas
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/money-counter">
                          <Calculator className="mr-2 h-4 w-4" /> Money Counter
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/shopping-list">
                          <ShoppingBag className="mr-2 h-4 w-4" /> Shopping List
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarUser></SidebarUser>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <div className="font-semibold">Panel de Administración</div>
            </header>

            <main className="flex-1 p-6">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
