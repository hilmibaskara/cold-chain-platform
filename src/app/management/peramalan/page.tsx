"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw, TrendingUp, Truck, Package, Clock, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import HeaderBar from "@/components/HeaderBar";
import SidebarNavigation from "@/components/SidebarNavigation";

// Activate isoWeek plugin for dayjs
dayjs.extend(isoWeek);

interface ProductForecast {
  forecast_date: string;
  product_name: string;
  quantity_forecast: number;
}

interface GroupedForecast {
  forecast_date: string;
  [productName: string]: number | string;
}

interface DeliveryPlan {
  id: string;
  product_name: string;
  quantity: number;
  scheduled_date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  driver_name: string;
  destination: string;
  temperature_requirement: string;
}

export default function ForecastResults() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [forecastData, setForecastData] = useState<GroupedForecast[]>([]);
  const [deliveryPlans, setDeliveryPlans] = useState<DeliveryPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  useEffect(() => {
    fetchForecast();
    fetchDeliveryPlans();
  }, [selectedDate]);

  const fetchForecast = async () => {
    setLoading(true);

    const startOfWeek = selectedDate.startOf("isoWeek").format("YYYY-MM-DD");
    const endOfWeek = selectedDate.endOf("isoWeek").format("YYYY-MM-DD");

    const response = await fetch(`/api/peramalan/getPeramalanMingguan?start_date=${startOfWeek}&end_date=${endOfWeek}`);
    if (!response.ok) {
      console.error("Failed to fetch forecast data");
      setForecastData([]);
      setLoading(false);
      return;
    }

    const data: ProductForecast[] = await response.json();

    // Group data for chart
    const grouped: Record<string, GroupedForecast> = {};
    data.forEach((row) => {
      if (!grouped[row.forecast_date]) {
        grouped[row.forecast_date] = { forecast_date: row.forecast_date };
      }
      grouped[row.forecast_date][row.product_name] = row.quantity_forecast;
    });

    const chartData = Object.values(grouped).sort((a, b) =>
      a.forecast_date.localeCompare(b.forecast_date)
    );
    setForecastData(chartData);
    setLoading(false);
  };

  const fetchDeliveryPlans = async () => {
    setLoadingDelivery(true);
    try {
      const startOfWeek = selectedDate.startOf("isoWeek").format("YYYY-MM-DD");
      // const endOfWeek = selectedDate.endOf("isoWeek").format("YYYY-MM-DD");

      // Mock data - replace with actual API call
      const mockDeliveryPlans: DeliveryPlan[] = [
        {
          id: "DEL-001",
          product_name: "Sayuran Segar",
          quantity: 150,
          scheduled_date: startOfWeek,
          status: "planned",
          driver_name: "Ahmad Wijaya",
          destination: "Supermarket A",
          temperature_requirement: "2-4°C"
        },
        {
          id: "DEL-002",
          product_name: "Buah Import",
          quantity: 200,
          scheduled_date: dayjs(startOfWeek).add(1, 'day').format("YYYY-MM-DD"),
          status: "in_progress",
          driver_name: "Budi Santoso",
          destination: "Mall Central",
          temperature_requirement: "0-2°C"
        },
        {
          id: "DEL-003",
          product_name: "Daging Beku",
          quantity: 300,
          scheduled_date: dayjs(startOfWeek).add(2, 'day').format("YYYY-MM-DD"),
          status: "completed",
          driver_name: "Candra Dewi",
          destination: "Restaurant Chain",
          temperature_requirement: "-18°C"
        },
        {
          id: "DEL-004",
          product_name: "Sayuran Segar",
          quantity: 120,
          scheduled_date: dayjs(startOfWeek).add(3, 'day').format("YYYY-MM-DD"),
          status: "delayed",
          driver_name: "Doni Pratama",
          destination: "Pasar Tradisional",
          temperature_requirement: "2-4°C"
        }
      ];

      setDeliveryPlans(mockDeliveryPlans);
    } catch (error) {
      console.error('Error fetching delivery plans:', error);
      setDeliveryPlans([]);
    } finally {
      setLoadingDelivery(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(dayjs(e.target.value));
  };

  const handleRefresh = () => {
    fetchForecast();
    fetchDeliveryPlans();
  };

  const handleGenerateForecast = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/peramalan/generateForecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: selectedDate.startOf("isoWeek").format("YYYY-MM-DD"),
          end_date: selectedDate.endOf("isoWeek").format("YYYY-MM-DD"),
        }),
      });
      
      if (response.ok) {
        await fetchForecast();
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Clock size={16} className="text-blue-600" />;
      case 'in_progress':
        return <Truck size={16} className="text-orange-600" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'delayed':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Package size={16} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'planned':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'in_progress':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'delayed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'Direncanakan';
      case 'in_progress': return 'Dalam Perjalanan';
      case 'completed': return 'Selesai';
      case 'delayed': return 'Terlambat';
      default: return status;
    }
  };

  // Dynamically extract product names for dynamic charting
  const allProducts = new Set<string>();
  forecastData.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (key !== "forecast_date") allProducts.add(key);
    });
  });

  // Color palette yang konsisten dengan tema
  const chartColors = [
    "#2563eb", // blue-600
    "#dc2626", // red-600
    "#059669", // emerald-600
    "#7c3aed", // violet-600
    "#ea580c", // orange-600
    "#0891b2", // cyan-600
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <HeaderBar />
      
      {/* Sidebar */}
      <SidebarNavigation />
      
      {/* Main Content */}
      <div className="ml-16">
        <div className="p-6">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Peramalan Kebutuhan Bahan Baku</h1>
            <p className="text-gray-600 text-md">Pantau dan analisis forecast permintaan produk</p>
          </div>

          {/* Controls Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Tanggal:
                  </label>
                  <input
                    type="date"
                    value={selectedDate.format("YYYY-MM-DD")}
                    onChange={handleDateChange}
                    className="text-gray-700 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  <p>Menampilkan forecast untuk minggu:</p>
                  <p className="font-medium text-gray-700">
                    {selectedDate.startOf("isoWeek").format("DD MMM YYYY")} - {selectedDate.endOf("isoWeek").format("DD MMM YYYY")}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading || loadingDelivery}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <RefreshCw size={16} className={(loading || loadingDelivery) ? "animate-spin" : ""} />
                  Refresh
                </button>
                
                {forecastData.length === 0 && !loading && (
                  <button
                    onClick={handleGenerateForecast}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <TrendingUp size={16} />
                    Generate Forecast
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Forecast Section */}
          {loading ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="text-center">
                <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-500">Loading forecast data...</p>
              </div>
            </div>
          ) : forecastData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <TrendingUp size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Tidak Ada Data Forecast</h3>
              <p className="text-gray-500 mb-4">Belum ada data forecast untuk periode yang dipilih.</p>
              <button
                onClick={handleGenerateForecast}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mx-auto"
              >
                <TrendingUp size={16} />
                Generate Forecast
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Chart Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-600" />
                  Grafik Forecast
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={forecastData}>
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="forecast_date" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    {Array.from(allProducts).map((product, index) => (
                      <Line
                        key={product}
                        type="monotone"
                        dataKey={product}
                        stroke={chartColors[index % chartColors.length]}
                        strokeWidth={2}
                        dot={{ fill: chartColors[index % chartColors.length], strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Table Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tabel Forecast</h2>
                <div className="overflow-y-auto max-h-[400px] border border-gray-200 rounded-md">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                          Tanggal
                        </th>
                        <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                          Produk
                        </th>
                        <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                          Jumlah (kg)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastData.map((row) => (
                        Array.from(allProducts).map((product) => (
                          row[product] && (
                            <tr key={`${row.forecast_date}-${product}`} className="hover:bg-gray-50 transition-colors">
                              <td className="border-b border-gray-100 p-3 text-sm text-gray-800">
                                {dayjs(row.forecast_date).format("DD/MM/YYYY")}
                              </td>
                              <td className="border-b border-gray-100 p-3 text-sm text-gray-800">
                                {product}
                              </td>
                              <td className="border-b border-gray-100 p-3 text-sm font-medium text-gray-800">
                                {typeof row[product] === 'number' ? row[product].toLocaleString() : row[product]}
                              </td>
                            </tr>
                          )
                        ))
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Plans Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Truck size={20} className="text-blue-600" />
                Status Rencana Pengiriman
              </h2>
              <button
                onClick={() => {
                  // Navigate to detailed delivery plans page
                  window.location.href = '/management/pengiriman';
                }}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium"
              >
                Lihat Selengkapnya
                <ExternalLink size={16} />
              </button>
            </div>
            
            {loadingDelivery ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-center">
                  <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-500">Loading delivery plans...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                        ID Pengiriman
                      </th>
                      <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                        Produk
                      </th>
                      <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                        Jumlah (kg)
                      </th>
                      <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                        Tanggal Kirim
                      </th>
                      <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                        Driver
                      </th>
                      <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                        Tujuan
                      </th>
                      <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                        Suhu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryPlans.slice(0, 5).map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                        <td className="border-b border-gray-100 p-3 text-sm font-medium text-gray-800">
                          {plan.id}
                        </td>
                        <td className="border-b border-gray-100 p-3 text-sm text-gray-800">
                          {plan.product_name}
                        </td>
                        <td className="border-b border-gray-100 p-3 text-sm text-gray-800">
                          {plan.quantity.toLocaleString()}
                        </td>
                        <td className="border-b border-gray-100 p-3 text-sm text-gray-800">
                          {dayjs(plan.scheduled_date).format("DD/MM/YYYY")}
                        </td>
                        <td className="border-b border-gray-100 p-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(plan.status)}
                            <span className={getStatusBadge(plan.status)}>
                              {getStatusText(plan.status)}
                            </span>
                          </div>
                        </td>
                        <td className="border-b border-gray-100 p-3 text-sm text-gray-800">
                          {plan.driver_name}
                        </td>
                        <td className="border-b border-gray-100 p-3 text-sm text-gray-800">
                          {plan.destination}
                        </td>
                        <td className="border-b border-gray-100 p-3 text-sm text-gray-800">
                          {plan.temperature_requirement}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {deliveryPlans.length > 5 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      Menampilkan 5 dari {deliveryPlans.length} rencana pengiriman
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}