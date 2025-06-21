"use client"

import { useState } from 'react';
import DeliveryCard from "@/components/Card";
import SidebarNavigation from "@/components/SidebarNavigation";
import HeaderBar from "@/components/HeaderBar";
import { deliveries } from "@/data/deliveryData";

export default function MonitoringPage() {
  // State untuk filter pengiriman
  const [activeFilter, setActiveFilter] = useState<'Rencana' | 'In Transit' | 'Riwayat'>('In Transit');
  
  // Filter pengiriman berdasarkan status yang aktif
  const filteredDeliveries = deliveries.filter(delivery => delivery.status === activeFilter);

  return (
    <div className="flex h-screen text-black">
      <SidebarNavigation />
      
      <div className="flex-1 flex flex-col bg-gray-50">
        <HeaderBar />

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/4 p-4 space-y-3 overflow-y-auto">
            {/* Segmented Control */}
            <div className="flex w-full bg-gray-100 rounded-lg p-1">
              {(['Rencana', 'In Transit', 'Riwayat'] as const).map((filter) => (
                <button
                  key={filter}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    activeFilter === filter
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Tampilkan pengiriman yang sudah difilter */}
            {filteredDeliveries.length > 0 ? (
              filteredDeliveries.map((delivery) => (
                <DeliveryCard 
                  key={delivery.deliveryNumber} 
                  {...delivery as { status: "Rencana" | "In Transit" | "Riwayat" | "Cancelled" } & Omit<typeof delivery, 'status'>} 
                />
              ))
            ) : (
              <div className="text-center p-4 text-gray-500">
                Tidak ada pengiriman dengan status {activeFilter}
              </div>
            )}
          </div>

          <div className="flex-1 p-4">
            <div className="w-full h-full rounded-2xl overflow-hidden shadow">
              <iframe 
                className="w-full h-full"
                src="https://maps.google.com/maps?q=Jakarta&z=13&output=embed"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}