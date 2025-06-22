'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    const checkLoginStatus = async () => {
      const { data } = await supabase.auth.getSession();
      
      // If user is logged in, redirect to pemantauan
      if (data.session) {
        router.push('/management/pemantauan');
      } else {
        // Otherwise redirect to login
        router.push('/login');
      }
    };
    
    checkLoginStatus();
  }, [router]);
  
  // Show a loading state while checking
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
