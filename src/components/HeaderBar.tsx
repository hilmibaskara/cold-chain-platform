"use client";

import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

export default function HeaderBar() {
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("Loading...");

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        // Get the current authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Fetch the profile data from profiles table
          const { data, error } = await supabase
            .from("profiles")
            .select("name, role")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
            return;
          }

          if (data) {
            setUserName(data.name || "User");
            setUserRole(data.role || "User");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    fetchUserProfile();
  }, []);

  return (
    <div className="flex justify-between items-center p-2 bg-white shadow-sm text-black w-full">
      <div className="flex items-center">
        <div className="text-2xl font-bold text-blue-600 mr-3">❄️</div>
        <h1 className="text-md font-semibold">Cold Chain Platform</h1>
      </div>
      <div className="flex items-center gap-3 mx-2">
        <User size={20} className="text-gray-600" />
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-tight">{userName}</span>
          <span className="text-xs text-gray-600 leading-tight">{userRole}</span>
        </div>
      </div>
    </div>
  );
}
