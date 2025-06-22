'use client'

import { Button } from "@/components/Button";
import { User } from "lucide-react";

export default function HeaderBar() {
  return (
    <div className="flex justify-between items-center p-2 bg-white shadow-sm text-black w-full">
      <div className="flex items-center">
        <div className="text-2xl font-bold text-blue-600 mr-3">❄️</div>
        <h1 className="text-md font-semibold">Cold Chain Platform</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => window.location.href='/profile'}>
          <User />
        </Button>
      </div>
    </div>
  );
}