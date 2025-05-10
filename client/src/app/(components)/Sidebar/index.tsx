"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import {
  Archive,
  CircleDollarSign,
  Clipboard,
  Layout,
  LogOut,
  LucideIcon,
  Menu,
  Settings,
  User,
  Tags,
  Box,
  FolderKanban,
  Receipt,
  Package,
  Users,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Truck,
  Shapes,
  ScrollText,
  Send,
  ClipboardList,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { authService } from "@/services/authService";

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  isCollapsed,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (pathname === "/" && href === "/dashboard");

  return (
    <Link href={href}>
      <div
        className={`cursor-pointer flex items-center ${
          isCollapsed ? "justify-center py-4" : "justify-start px-8 py-4"
        }
        hover:text-blue-500 hover:bg-blue-100 gap-3 transition-colors ${
          isActive ? "bg-blue-200 text-white" : ""
        }
      }`}
      >
        <Icon className="w-6 h-6 !text-gray-700" />

        <span
          className={`${
            isCollapsed ? "hidden" : "block"
          } font-medium text-gray-700`}
        >
          {label}
        </span>
      </div>
    </Link>
  );
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const sidebarClassNames = `fixed flex flex-col ${
    isSidebarCollapsed ? "w-0 md:w-16" : "w-72 md:w-64"
  } bg-white transition-all duration-300 overflow-hidden h-full shadow-md z-40`;

  return (
    <div className={sidebarClassNames}>
      {/* TOP LOGO */}
      <div
        className={`flex gap-3 justify-between md:justify-normal items-center pt-8 ${
          isSidebarCollapsed ? "px-5" : "px-8"
        }`}
      >
        <Image
          src="/images/logo.png"
          alt="warehouse-logo"
          width={27}
          height={27}
          className="rounded w-8"
        />
        <h1
          className={`${
            isSidebarCollapsed ? "hidden" : "block"
          } font-extrabold text-2xl`}
        >
          WAREHOUSE
        </h1>

        <button
          className="md:hidden px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100"
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* LINKS */}
      <div className="flex flex-col mt-8 grow">
        <SidebarLink
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/products"
          icon={Package}
          label="Products"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/inventory"
          icon={Boxes}
          label="Inventory"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/categories"
          icon={FolderKanban}
          label="Categories"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/expenses"
          icon={Receipt}
          label="Expenses"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/storage/bins"
          icon={Archive}
          label="Storage Bins"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/inventory/receive"
          icon={Truck}
          label="Receive Stock"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/inventory/receipts"
          icon={ScrollText}
          label="Receipts Log"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/inventory/ship"
          icon={Send}
          label="Create Shipment"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/inventory/shipments"
          icon={ClipboardList}
          label="Shipments Log"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/users"
          icon={Users}
          label="Users"
          isCollapsed={isSidebarCollapsed}
        />
      </div>

      {/* BOTTOM BUTTONS */}
      <div className="mt-auto mb-4">
        <Link href="/settings">
          <div
            className={`w-full flex items-center ${
              isSidebarCollapsed ? "justify-center py-4" : "justify-start px-8 py-4"
            } hover:text-blue-500 hover:bg-blue-100 gap-3 transition-colors`}
          >
            <Settings className="w-6 h-6 !text-gray-700" />
            <span
              className={`${
                isSidebarCollapsed ? "hidden" : "block"
              } font-medium text-gray-700`}
            >
              Settings
            </span>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${
            isSidebarCollapsed ? "justify-center py-4" : "justify-start px-8 py-4"
          } hover:text-red-500 hover:bg-red-100 gap-3 transition-colors`}
        >
          <LogOut className="w-6 h-6 !text-gray-700" />
          <span
            className={`${
              isSidebarCollapsed ? "hidden" : "block"
            } font-medium text-gray-700`}
          >
            Logout
          </span>
        </button>
      </div>

      {/* FOOTER */}
      <div className={`${isSidebarCollapsed ? "hidden" : "block"} mb-10`}>
        <p className="text-center text-xs text-gray-500">&copy; 2024 Test Person 1</p>
      </div>
    </div>
  );
};

export default Sidebar;
