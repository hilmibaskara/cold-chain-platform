'use client'

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Home, BarChart2, Truck, LogOut } from 'lucide-react';

export default function SidebarNavigation() {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`${collapsed ? 'w-16' : 'w-48'} bg-white border-r border-blue-100 flex flex-col justify-between transition-all duration-500 ease-in-out shadow-sm`}>
      <div>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-center'} h-20 border-blue-100 px-4`}>
          {!collapsed && <div className="text-4xl font-bold text-blue-600 transition-opacity duration-500">❄️</div>}
          {collapsed && <div className="text-2xl font-bold text-blue-600 transition-opacity duration-500">❄️</div>}
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 rounded-full hover:bg-blue-50 transition-colors duration-300"
          >
            {collapsed ? <ChevronRight size={18} className="text-blue-500" /> : <ChevronLeft size={18} className="text-blue-500" />}
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-4 text-gray-700">
          <a href="/dashboard" className={`flex items-center hover:text-blue-600 rounded-lg p-2 hover:bg-blue-50 transition-all duration-300 ${collapsed ? 'justify-center' : ''}`}>
            <Home size={20} className={`transition-all duration-300 ${collapsed ? "mx-auto" : "mr-2"} text-blue-500`} />
            {!collapsed && <span className="transition-opacity duration-500">Dashboard</span>}
          </a>
          <a href="/forecast" className={`flex items-center hover:text-blue-600 rounded-lg p-2 hover:bg-blue-50 transition-all duration-300 ${collapsed ? 'justify-center' : ''}`}>
            <BarChart2 size={20} className={`transition-all duration-300 ${collapsed ? "mx-auto" : "mr-2"} text-blue-500`} />
            {!collapsed && <span className="transition-opacity duration-500">Forecasting</span>}
          </a>
          <a href="/monitoring" className={`flex items-center hover:text-blue-600 rounded-lg p-2 hover:bg-blue-50 transition-all duration-300 ${collapsed ? 'justify-center' : ''}`}>
            <Truck size={20} className={`transition-all duration-300 ${collapsed ? "mx-auto" : "mr-2"} text-blue-500`} />
            {!collapsed && <span className="transition-opacity duration-500">Delivery</span>}
          </a>
        </nav>
      </div>
      <div className={`p-4 flex flex-col space-y-3 ${collapsed ? 'items-center' : ''}`}>
        {/* <a href="/settings" className={`hover:text-blue-600 rounded-lg p-2 hover:bg-blue-50 transition-all duration-300 flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <Settings size={20} className={`transition-all duration-300 ${collapsed ? "mx-auto" : "mr-2"} text-blue-500`} />
          {!collapsed && <span className="transition-opacity duration-500">Settings</span>}
        </a> */}
        <button className={`${collapsed ? 'justify-center' : ''} text-red-500 font-medium flex items-center rounded-lg p-2 hover:bg-red-50 transition-all duration-300`}>
          <LogOut size={20} className={`transition-all duration-300 ${collapsed ? "mx-auto" : "mr-2"}`} />
          {!collapsed && <span className="transition-opacity duration-500">Logout</span>}
        </button>
      </div>
    </div>
  );
}