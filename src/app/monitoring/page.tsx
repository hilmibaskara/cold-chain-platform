"use client";

import { useState, useEffect, useRef } from "react";
import DeliveryCard from "@/components/Card";
import SidebarNavigation from "@/components/SidebarNavigation";
import HeaderBar from "@/components/HeaderBar";
import { deliveries } from "@/data/deliveryData";

export default function MonitoringPage() {
  // State untuk filter pengiriman
  const [activeFilter, setActiveFilter] = useState<
    "Rencana" | "In Transit" | "Riwayat"
  >("In Transit");

  // API key untuk Google Maps
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  // Refs untuk Google Maps
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Filter pengiriman berdasarkan status yang aktif
  const filteredDeliveries = deliveries.filter(
    (delivery) => delivery.status === activeFilter
  );

  // Inisialisasi Google Maps
  useEffect(() => {
    // Skip if API key is missing or map container is not ready
    if (!GOOGLE_MAPS_API_KEY || !mapContainerRef.current) return;
    
    // Load Google Maps API script
    const loadMapScript = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Define the callback function
      window.initMap = initializeMap;
      document.head.appendChild(script);
    };
    
    // Initialize map and add custom markers
    const initializeMap = () => {
      if (!mapContainerRef.current) return;
      
      // Create the map
      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: { lat: -6.9175, lng: 107.6191 }, // Bandung coordinates
        zoom: 12,
      });
      
      // Add fixed marker at specified coordinates
      const fixedMarker = new google.maps.Marker({
        position: { lat: -6.901231, lng: 107.587646 },
        map: mapRef.current,
        title: "Fixed Location",
        icon: {
          url: '/truck-marker.svg',  // You can use a different icon if available
          scaledSize: new google.maps.Size(32, 32)
        },
        animation: google.maps.Animation.DROP
      });
      
      // Add info window for fixed marker
      const fixedInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0; font-weight: bold;">Fixed Location</h3>
            <p style="margin: 5px 0 0;">Lat: -6.901231, Lng: 107.587646</p>
          </div>
        `
      });
      
      // Open info window on click for fixed marker
      fixedMarker.addListener("click", () => {
        fixedInfoWindow.open({
          anchor: fixedMarker,
          map: mapRef.current
        });
      });
      
      // Add markers for active deliveries
      filteredDeliveries.forEach(delivery => {
        // Sample coordinates (replace with actual delivery coordinates)
        const position = { 
          lat: -6.9175 + (Math.random() - 0.5) * 0.05, 
          lng: 107.6191 + (Math.random() - 0.5) * 0.05 
        };
        
        // Create custom marker
        const marker = new google.maps.Marker({
          position,
          map: mapRef.current,
          title: `${delivery.deliveryNumber}: ${delivery.driver}`,
          icon: {
            url: delivery.status === 'In Transit' 
              ? '/images/truck-marker.svg'  // Custom marker icon for in transit
              : delivery.status === 'Rencana'
              ? '/images/planned-marker.svg' // Custom marker for planned
              : '/images/history-marker.svg',  // Custom marker for history
            scaledSize: new google.maps.Size(32, 32)
          },
          animation: google.maps.Animation.DROP
        });
        
        // Add info window for each marker
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0; font-weight: bold;">${delivery.deliveryNumber}</h3>
              <p style="margin: 5px 0 0;">Driver: ${delivery.driver}</p>
              <p style="margin: 5px 0 0;">Status: ${delivery.status}</p>
              <p style="margin: 5px 0 0;">Temperature: ${delivery.currentTemperature}°C</p>
            </div>
          `
        });
        
        // Open info window on click
        marker.addListener("click", () => {
          infoWindow.open({
            anchor: marker,
            map: mapRef.current
          });
        });
      });
    };
    
    loadMapScript();
    
    // Cleanup script tag on unmount
    return () => {
      delete window.initMap;
      const script = document.querySelector('script[src*="maps.googleapis.com/maps/api"]');
      if (script) {
        script.remove();
      }
    };
  }, [filteredDeliveries, GOOGLE_MAPS_API_KEY]);

  return (
    <div className="flex h-screen text-black">
      <SidebarNavigation />

      <div className="flex-1 flex flex-col bg-gray-50">
        <HeaderBar />

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/4 p-4 space-y-3 overflow-y-auto">
            {/* Segmented Control */}
            <div className="flex w-full bg-gray-100 rounded-lg p-1">
              {(["Rencana", "In Transit", "Riwayat"] as const).map((filter) => (
                <button
                  key={filter}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    activeFilter === filter
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
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
                  {...(delivery as {
                    status: "Rencana" | "In Transit" | "Riwayat" | "Cancelled";
                  } & Omit<typeof delivery, "status">)}
                />
              ))
            ) : (
              <div className="text-center p-4 text-gray-500">
                Tidak ada pengiriman dengan status {activeFilter}
              </div>
            )}
          </div>

          <div className="flex-1 p-4">
            <div 
              ref={mapContainerRef}
              className="w-full h-full rounded-2xl overflow-hidden shadow"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add TypeScript interface for the global window object
declare global {
  interface Window {
    initMap?: () => void;
    google: typeof google;
  }
}
