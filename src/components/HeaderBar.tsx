'use client'

import { Button } from "@/components/Button";
import { User } from "lucide-react";

export default function HeaderBar() {
  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-sm text-black">
      <h1 className="text-xl font-semibold">Delivery</h1>
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => window.location.href='/profile'}>
          <User />
        </Button>
      </div>
    </div>
  );
}