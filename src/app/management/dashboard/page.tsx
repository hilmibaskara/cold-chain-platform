"use client";

import React from 'react';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-lg mb-2">Total Deliveries</h2>
          <p className="text-3xl font-semibold">125</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-lg mb-2">In Transit</h2>
          <p className="text-3xl font-semibold text-blue-600">42</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-lg mb-2">Temperature Alerts</h2>
          <p className="text-3xl font-semibold text-red-600">3</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="font-bold text-lg mb-4">Recent Deliveries</h2>
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">ID</th>
              <th className="text-left py-2">Driver</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Temperature</th>
              <th className="text-left py-2">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">DEL-2023-001</td>
              <td className="py-2">John Doe</td>
              <td className="py-2"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">In Transit</span></td>
              <td className="py-2">2.5°C</td>
              <td className="py-2">10 minutes ago</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">DEL-2023-002</td>
              <td className="py-2">Jane Smith</td>
              <td className="py-2"><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Delivered</span></td>
              <td className="py-2">2.1°C</td>
              <td className="py-2">1 hour ago</td>
            </tr>
            <tr>
              <td className="py-2">DEL-2023-003</td>
              <td className="py-2">Mike Johnson</td>
              <td className="py-2"><span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Preparing</span></td>
              <td className="py-2">-</td>
              <td className="py-2">2 hours ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}