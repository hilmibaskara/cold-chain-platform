"use client";

import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { deliveries } from "@/data/deliveryData";

interface MapComponentProps {
  sensorData: Array<{
    id: number;
    recorded_at: string;
    temperature: number;
    latitude: number;
    longitude: number;
    id_delivery?: number;
  }>;
  className?: string;
}

// Create a global loader instance outside the component
const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  version: "weekly",
});

// Keep track of whether Maps API is already loaded
let mapsApiLoaded = false;

export default function MapComponent({ sensorData, className = "" }: MapComponentProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map only once
  useEffect(() => {
    // Skip if map is already initialized or container isn't ready
    if (mapRef.current || !mapContainerRef.current) return;
    
    const initMap = async () => {
      try {
        // Only load API if not already loaded
        if (!mapsApiLoaded) {
          await loader.load();
          mapsApiLoaded = true;
        }
        
        // Create new map instance
        mapRef.current = new google.maps.Map(mapContainerRef.current!, {
          center: { lat: -6.2088, lng: 106.8456 }, // Default to Jakarta
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        
        setMapLoaded(true);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initMap();
    
    // Cleanup function
    return () => {
      // Clear markers on unmount
      clearMarkers();
    };
  }, []);

  // Function to clear all markers
  const clearMarkers = () => {
    if (markersRef.current) {
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = [];
    }
  };

  // Update markers when sensor data changes
  useEffect(() => {
    // Only update markers if map is loaded
    if (!mapLoaded || !mapRef.current) return;
    
    updateMarkers();
  }, [sensorData, mapLoaded]);

  // Function to update markers without reinitializing the map
  const updateMarkers = () => {
    if (!mapRef.current) return;

    // Clear existing markers
    clearMarkers();

    // Only add marker if we have real-time data
    if (sensorData.length > 0) {
      // Just display the most recent data point (index 0)
      const data = sensorData[0];
      
      // Only create marker if valid coordinates exist
      if (data && data.latitude && data.longitude) {
        // Find associated delivery by id_delivery if available
        let associatedDelivery = deliveries[0]; // Default to first delivery if not found
        if (data.id_delivery) {
          const found = deliveries.find(d => d.deliveryNumber === data.id_delivery?.toString().padStart(5, '0'));
          if (found) associatedDelivery = found;
        }
        
        try {
          // Create marker for latest sensor data
          const marker = new google.maps.Marker({
            position: { lat: data.latitude, lng: data.longitude },
            map: mapRef.current,
            title: `Current position: ${associatedDelivery.deliveryNumber}`,
            icon: {
              url: '/truck-marker.svg',  // Use truck icon
              scaledSize: new google.maps.Size(40, 40)
            },
          });
          
          // Add to markers array for cleanup
          markersRef.current.push(marker);
          
          // Add info window for the marker
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="margin: 0; font-weight: bold;">#${associatedDelivery.deliveryNumber}</h3>
                <p style="margin: 5px 0 0;">Driver: ${associatedDelivery.driver}</p>
                <p style="margin: 5px 0 0;">Temperature: ${data.temperature}°C</p>
              </div>
            `
          });
          
          // Open info window only on click
          marker.addListener("click", () => {
            infoWindow.open({
              anchor: marker,
              map: mapRef.current
            });
          });
          
          // Center map on marker
          mapRef.current.setCenter({ lat: data.latitude, lng: data.longitude });
        } catch (err) {
          console.error("Error creating marker:", err);
        }
      }
    }
    // If no sensor data, show empty map (no markers)
  };

  return (
    <div 
      ref={mapContainerRef} 
      className={`w-full h-full rounded-lg shadow-sm overflow-hidden ${className}`}
      style={{ minHeight: "400px" }}
    ></div>
  );
}