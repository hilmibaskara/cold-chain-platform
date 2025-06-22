"use client";

import { useState } from "react";
import { Home, BarChart2, Truck, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export default function SidebarNavigation() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path === "/peramalan" && pathname === "/peramalan") return true;
    if (path === "/pemantauan" && pathname.includes("/pemantauan")) return true;
    return false;
  };

  return (
    <div
      className={`h-full fixed text-sm left-0 bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
        isExpanded ? "w-48" : "w-16"
      } z-10`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col">
        {/* Navigation Links */}
        <nav className="flex flex-col space-y-1 p-3 flex-grow">
          <a
            href="/management/dashboard"
            className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive("/dashboard")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Home
              size={16}
              className={`transition-all duration-300 flex-shrink-0 ${
                isActive("/dashboard") ? "text-blue-600" : "text-gray-500"
              }`}
            />
            <span
              className={`ml-3 transition-opacity duration-300 whitespace-nowrap ${
                isExpanded ? "opacity-100" : "opacity-0"
              }`}
            >
              Dashboard
            </span>
          </a>

          <a
            href="/management/peramalan"
            className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive("/peramalan")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BarChart2
              size={16}
              className={`transition-all duration-300 flex-shrink-0 ${
                isActive("/peramalan") ? "text-blue-600" : "text-gray-500"
              }`}
            />
            <span
              className={`ml-3 transition-opacity duration-300 whitespace-nowrap ${
                isExpanded ? "opacity-100" : "opacity-0"
              }`}
            >
              Peramalan
            </span>
          </a>

          <a
            href="/management/pemantauan"
            className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
              isActive("/pemantauan")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Truck
              size={16}
              className={`transition-all duration-300 flex-shrink-0 ${
                isActive("/pemantauan") ? "text-blue-600" : "text-gray-500"
              }`}
            />
            <span
              className={`ml-3 transition-opacity duration-300 whitespace-nowrap ${
                isExpanded ? "opacity-100" : "opacity-0"
              }`}
            >
              Pemantauan
            </span>
          </a>
        </nav>

        {/* Logout Button positioned at 1/10 from bottom */}
        <div className="absolute bottom-1/4 w-full p-3 border-t border-gray-200 bg-white">
          <button 
            onClick={handleLogout} 
            className="flex w-full items-center p-3 rounded-lg transition-all duration-200 text-gray-600 hover:bg-red-50"
          >
            <LogOut size={20} className="flex-shrink-0 text-gray-500 transition-all duration-200" />
            <span className={`ml-3 transition-opacity duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              Keluar
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
