"use client";

import React, { useState } from 'react';

type RouteId = 'route-001' | 'route-002' | 'route-003';

export default function ForecastPage() {
  const [selectedRoute, setSelectedRoute] = useState<RouteId>('route-001');

  // Sample forecast data (in real app, this would come from an API)
  const forecastData = {
    'route-001': [
      { hour: '00:00', temperature: 2.1, humidity: 85 },
      { hour: '04:00', temperature: 1.8, humidity: 87 },
      { hour: '08:00', temperature: 2.5, humidity: 82 },
      { hour: '12:00', temperature: 3.2, humidity: 78 },
      { hour: '16:00', temperature: 2.9, humidity: 80 },
      { hour: '20:00', temperature: 2.3, humidity: 84 },
    ],
    'route-002': [
      { hour: '00:00', temperature: 2.3, humidity: 84 },
      { hour: '04:00', temperature: 2.0, humidity: 86 },
      { hour: '08:00', temperature: 2.8, humidity: 80 },
      { hour: '12:00', temperature: 3.5, humidity: 76 },
      { hour: '16:00', temperature: 3.1, humidity: 78 },
      { hour: '20:00', temperature: 2.5, humidity: 82 },
    ],
    'route-003': [
      { hour: '00:00', temperature: 1.9, humidity: 86 },
      { hour: '04:00', temperature: 1.6, humidity: 88 },
      { hour: '08:00', temperature: 2.2, humidity: 83 },
      { hour: '12:00', temperature: 2.8, humidity: 79 },
      { hour: '16:00', temperature: 2.5, humidity: 81 },
      { hour: '20:00', temperature: 2.0, humidity: 85 },
    ],
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Temperature Forecast</h1>

      <div className="mb-6">
        <label htmlFor="route" className="block text-sm font-medium text-gray-700 mb-1">
          Select Route
        </label>
        <select
          id="route"
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value as RouteId)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="route-001">Bandung - Jakarta (Route 001)</option>
          <option value="route-002">Bandung - Surabaya (Route 002)</option>
          <option value="route-003">Bandung - Semarang (Route 003)</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">24-Hour Temperature Forecast</h2>
        <div className="overflow-x-auto">
          <div className="min-w-full h-60 flex items-end space-x-4 border-b border-gray-200 pb-4">
            {forecastData[selectedRoute].map((data, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="bg-blue-500 w-12 rounded-t-md" 
                  style={{ 
                    height: `${(data.temperature * 15)}px`,
                    backgroundColor: data.temperature > 3 ? '#f87171' : '#60a5fa'
                  }}
                ></div>
                <div className="text-xs mt-2">{data.hour}</div>
                <div className="text-sm font-medium">{data.temperature}°C</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-bold text-lg mb-4">Route Details</h2>
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Time</th>
              <th className="text-left py-2">Temperature</th>
              <th className="text-left py-2">Humidity</th>
              <th className="text-left py-2">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {forecastData[selectedRoute].map((data, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{data.hour}</td>
                <td className="py-2">{data.temperature}°C</td>
                <td className="py-2">{data.humidity}%</td>
                <td className="py-2">
                  <span 
                    className={`px-2 py-1 rounded-full text-xs ${
                      data.temperature > 3 
                        ? 'bg-red-100 text-red-800' 
                        : data.temperature > 2.5 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {data.temperature > 3 
                      ? 'High' 
                      : data.temperature > 2.5 
                      ? 'Medium'
                      : 'Low'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}