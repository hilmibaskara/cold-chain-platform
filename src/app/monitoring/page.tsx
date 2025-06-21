"use client";

import { useState, useEffect, useRef } from "react";
import DeliveryCard from "@/components/Card";
import SidebarNavigation from "@/components/SidebarNavigation";
import HeaderBar from "@/components/HeaderBar";
import { deliveries } from "@/data/deliveryData";
import { createClient } from "@/utils/supabase/client";

// Interface for sensor data from database
interface SensorData {
  id: number;
  recorded_at: string;
  temperature: number;
  latitude: number;
  longitude: number;
  id_delivery?: number;
}

export default function MonitoringPage() {
  // State untuk filter pengiriman
  const [activeFilter, setActiveFilter] = useState<
    "Rencana" | "In Transit" | "Riwayat"
  >("In Transit");

  // State to store real-time sensor data
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // API key untuk Google Maps
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  // Refs untuk Google Maps
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const isMapInitialized = useRef<boolean>(false);
  
  // Filter pengiriman berdasarkan status yang aktif
  const filteredDeliveries = deliveries.filter(
    (delivery) => delivery.status === activeFilter
  );

  // Function to clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  // Function to update markers without reinitializing the map
  const updateMarkers = () => {
    if (!mapRef.current) return;

    // Clear existing markers
    clearMarkers();

    // Only add markers if we have real sensor data
    if (sensorData.length > 0) {
      sensorData.forEach((data, index) => {
        if (!data.latitude || !data.longitude) return;
        
        // Find associated delivery by id_delivery if available
        let associatedDelivery = deliveries[0]; // Default to first delivery if not found
        if (data.id_delivery) {
          const found = deliveries.find(d => d.deliveryNumber === data.id_delivery?.toString().padStart(5, '0'));
          if (found) associatedDelivery = found;
        }
        
        // Only show the first/latest position as a moving truck
        const isLatest = index === 0;
        
        // Create marker for sensor data
        const marker = new google.maps.Marker({
          position: { lat: data.latitude, lng: data.longitude },
          map: mapRef.current,
          title: isLatest 
            ? `Latest position: ${associatedDelivery.deliveryNumber}`
            : `Historical position at ${new Date(data.recorded_at).toLocaleTimeString()}`,
          icon: {
            url: isLatest
              ? '/truck-marker.svg'  // Use truck icon for latest position
              : index < 5
                ? '/planned-marker.svg' // Recent positions
                : '/history-marker.svg',  // Older positions
            scaledSize: new google.maps.Size(isLatest ? 40 : 24, isLatest ? 40 : 24)
          },
          animation: isLatest ? google.maps.Animation.BOUNCE : null
        });
        
        // Add to markers array for cleanup
        markersRef.current.push(marker);
        
        // Add info window for each marker
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0; font-weight: bold;">${associatedDelivery.deliveryNumber}</h3>
              <p style="margin: 5px 0 0;">Driver: ${associatedDelivery.driver}</p>
              <p style="margin: 5px 0 0;">Temperature: ${data.temperature}°C</p>
              <p style="margin: 5px 0 0;">Time: ${new Date(data.recorded_at).toLocaleString()}</p>
              <p style="margin: 5px 0 0;">Coordinates: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}</p>
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
        
        // Auto-open info window for latest position and center map on it
        if (isLatest) {
          infoWindow.open({
            anchor: marker,
            map: mapRef.current
          });
          
          // Update map center to latest position with smooth transition
          mapRef.current?.panTo({ lat: data.latitude, lng: data.longitude });
        }
      });
    }
    // If no sensor data, show empty map (no random markers)
  };

  // Fetch sensor data from Supabase
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('sensor_data')
          .select('*')
          .order('recorded_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching sensor data:', error);
          return;
        }

        if (data) {
          setSensorData(data as SensorData[]);
        }
      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSensorData();

    // Set up real-time subscription
    const setupRealtimeSubscription = async () => {
      try {
        const supabase = createClient();
        
        const subscription = supabase
          .channel('sensor_data_changes')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'sensor_data' 
            }, 
            (payload) => {
              setSensorData(currentData => {
                const newData = payload.new as SensorData;
                // Add new data at the beginning and limit to 20 records
                return [newData, ...currentData].slice(0, 20);
              });
            })
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Failed to set up realtime subscription:', error);
      }
    };

    const cleanup = setupRealtimeSubscription();
    
    // Cleanup subscription on unmount
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, []);

  // Initialize Google Maps (only once)
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !mapContainerRef.current || isMapInitialized.current) return;
    
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
    
    // Initialize map
    const initializeMap = () => {
      if (!mapContainerRef.current || isMapInitialized.current) return;
      
      // Default map center (Bandung) - will be updated when sensor data arrives
      const defaultCenter = { lat: -6.9175, lng: 107.6191 };
      
      // Create the map
      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
      });
      
      isMapInitialized.current = true;
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
  }, [GOOGLE_MAPS_API_KEY]); // Removed sensorData from dependency array

  // Update markers when sensor data or filter changes
  useEffect(() => {
    if (isMapInitialized.current && mapRef.current) {
      updateMarkers();
      
      // Center map on latest sensor data if available
      if (sensorData.length > 0) {
        const latestData = sensorData[0];
        if (latestData.latitude && latestData.longitude) {
          mapRef.current.panTo({
            lat: latestData.latitude,
            lng: latestData.longitude
          });
        }
      }
    }
  }, [sensorData, filteredDeliveries]);

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

            {/* Real-time temperature data indicator */}
            {sensorData.length > 0 && (
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                <h3 className="font-medium text-sm mb-2">Latest Sensor Data</h3>
                <div className="text-sm">
                  <p>Temperature: <span className="font-bold text-blue-600">{sensorData[0].temperature}°C</span></p>
                  <p>Time: {new Date(sensorData[0].recorded_at).toLocaleTimeString()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {loading ? "Updating..." : `Last updated ${new Date().toLocaleTimeString()}`}
                  </p>
                </div>
              </div>
            )}

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
