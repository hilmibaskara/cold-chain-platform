"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DeliveryCard from "@/components/Card";
import SidebarNavigation from "@/components/SidebarNavigation";
import HeaderBar from "@/components/HeaderBar";
import MapComponent from "@/components/Map";
import { deliveries } from "@/data/deliveryData";
import { supabase } from '@/utils/supabase/client';

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
  const [activeFilter, setActiveFilter] = useState<"Rencana" | "In Transit" | "Riwayat">("In Transit");

  // State to store real-time sensor data
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  
  const router = useRouter();
  
  // Check user authorization
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        
        // Get current session
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          router.push('/login');
          return;
        }

        console.log(data)

        // Check if session exists
        if (!data.session) {
          console.log("No session found, redirecting to login");
          router.push('/login');
          return;
        }

        console.log("Session found:", data.session.user.id);
        
        // Get user profile with role information
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          
          // Special handling for no profile - we'll create one with default role
          if (profileError.code === 'PGRST116') {
            // No profile found, create one with default role
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                role: 'manajemen', // Default role
                email: data.session.user.email,
                created_at: new Date().toISOString()
              });
              
            if (insertError) {
              console.error('Error creating profile:', insertError);
              router.push('/login');
              return;
            }
            
            // Profile created with manajemen role, allow access
            setIsAuthorized(true);
            setAuthChecking(false);
            return;
          }
          
          router.push('/login');
          return;
        }
        
        // Check if user has manajemen role
        if (profile && profile.role === 'manajemen') {
          console.log("User has manajemen role, granting access");
          setIsAuthorized(true);
        } else {
          // User doesn't have required role
          console.log("User doesn't have manajemen role, redirecting to unauthorized");
          router.push('/unauthorized');
        }
      } catch (error) {
        console.error('Authorization check failed:', error);
        router.push('/login');
      } finally {
        setAuthChecking(false);
      }
    };
    
    checkUserRole();
  }, [router]);
  
  // Filter pengiriman berdasarkan status yang aktif
  const filteredDeliveries = deliveries.filter(
    (delivery) => delivery.status === activeFilter
  );

  // Fetch sensor data from Supabase and set up subscription
  useEffect(() => {
    // Only fetch data if user is authorized
    if (!isAuthorized) return;
    
    const fetchSensorData = async () => {
      try {
        setLoading(true);
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

    // Set up real-time subscription
    const setupRealtimeSubscription = () => {
      try {
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

        return subscription;
      } catch (error) {
        console.error('Failed to set up realtime subscription:', error);
        return null;
      }
    };

    // Fetch initial data
    fetchSensorData();
      
    // Set up subscription
    const subscription = setupRealtimeSubscription();
    
    // Clean up subscription when component unmounts
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isAuthorized]);

  // Show loading state while checking authorization
  if (authChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }
  
  // If not authorized, the useEffect will redirect, but we should still handle the case
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen text-black">
      <HeaderBar />
      
      <div className="flex flex-1 relative overflow-hidden">
        <SidebarNavigation />
        
        <div className="flex-1 ml-16 bg-gray-50"> {/* ml-16 to offset the sidebar width */}
          <div className="flex h-full">
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
              <MapComponent sensorData={sensorData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
