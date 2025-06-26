"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import HeaderBar from "@/components/HeaderBar";
import SidebarNavigation from "@/components/SidebarNavigation";
import {
  Truck,
  MapPin,
  Thermometer,
  Calendar,
  Filter,
  RefreshCw,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
} from "lucide-react";
import dayjs from "dayjs";

interface Driver {
  id: string;
  name: string;
  role: string;
}

interface Delivery {
  id_delivery: number;
  delivery_status: string;
  temperature_threshold: number;
  plan_date: string;
  depart_lat: number;
  depart_lon: number;
  arrive_lat: number;
  arrive_lon: number;
  id_driver?: string;
  id_container?: string;
  quality_status?: string;
  plan_start_time?: string;
  plan_end_time?: string;
  start_time?: string;
  end_time?: string;
  drivers?: {
    id: string;
    name: string;
    role: string;
  };
}

const deliveryStatuses = [
  { value: "all", label: "Semua Status" },
  { value: "draft", label: "Draft" },
  { value: "planned", label: "Direncanakan" },
  { value: "in_transit", label: "Dalam Perjalanan" },
  { value: "delivered", label: "Terkirim" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function DeliveryList() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_driver: "",
    plan_start_time: "",
    plan_end_time: "",
  });

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, role")
      .eq("role", "pengemudi");

    if (error) {
      console.error("Error fetching drivers:", error);
    } else {
      setDrivers(data || []);
    }
  };

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("deliveries")
      .select(
        `
        id_delivery,
        delivery_status,
        temperature_threshold,
        plan_date,
        depart_lat,
        depart_lon,
        arrive_lat,
        arrive_lon,
        id_driver,
        id_container,
        quality_status,
        plan_start_time,
        plan_end_time,
        start_time,
        end_time,
        profiles (
        id,
        name,
        role
        )
    `
      )
      .order("plan_date", { ascending: true });

    if (statusFilter !== "all") {
      query = query.eq("delivery_status", statusFilter);
    }

    const { data, error } = await query;

    console.log(data);

    if (error) {
      console.error(error);
      setDeliveries([]);
    } else {
      // Transform the data to flatten the nested structure
      const transformedData = (data?.map((delivery) => ({
        ...delivery,
        drivers: Array.isArray(delivery.profiles) && delivery.profiles.length > 0 
          ? delivery.profiles[0] 
          : delivery.profiles,
      })) || []) as Delivery[];

      setDeliveries(transformedData);
    }

    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchDeliveries();
    fetchDrivers();
  }, [fetchDeliveries]);

  const openModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setFormData({
      id_driver: delivery.id_driver || "",
      plan_start_time: delivery.plan_start_time ? dayjs(delivery.plan_start_time).format("HH:mm") : "",
      plan_end_time: delivery.plan_end_time ? dayjs(delivery.plan_end_time).format("HH:mm") : "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDelivery(null);
    setFormData({
      id_driver: "",
      plan_start_time: "",
      plan_end_time: "",
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    const updateData: Record<string, string | null> = {};
    
    // Update driver
    if (formData.id_driver !== selectedDelivery.id_driver) {
      updateData.id_driver = formData.id_driver || null;
    }

    // Update times - combine with existing date
    if (formData.plan_start_time) {
      const baseDate = selectedDelivery.plan_date;
      const startDateTime = dayjs(baseDate).hour(parseInt(formData.plan_start_time.split(':')[0])).minute(parseInt(formData.plan_start_time.split(':')[1])).toISOString();
      updateData.plan_start_time = startDateTime;
    }

    if (formData.plan_end_time) {
      const baseDate = selectedDelivery.plan_date;
      const endDateTime = dayjs(baseDate).hour(parseInt(formData.plan_end_time.split(':')[0])).minute(parseInt(formData.plan_end_time.split(':')[1])).toISOString();
      updateData.plan_end_time = endDateTime;
    }

    if (Object.keys(updateData).length === 0) {
      closeModal();
      return;
    }

    const { error } = await supabase
      .from("deliveries")
      .update(updateData)
      .eq("id_delivery", selectedDelivery.id_delivery);

    if (error) {
      console.error("Error updating delivery:", error);
      alert("Gagal mengupdate data pengiriman");
    } else {
      // Refresh data
      await fetchDeliveries();
      closeModal();
      alert("Data pengiriman berhasil diupdate");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Package size={16} className="text-gray-600" />;
      case "planned":
        return <Clock size={16} className="text-blue-600" />;
      case "in_transit":
        return <Truck size={16} className="text-orange-600" />;
      case "delivered":
        return <CheckCircle size={16} className="text-green-600" />;
      case "cancelled":
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses =
      "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 w-fit";
    switch (status) {
      case "draft":
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case "planned":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "in_transit":
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case "delivered":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "cancelled":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status: string) => {
    const statusObj = deliveryStatuses.find((s) => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const handleRefresh = () => {
    fetchDeliveries();
    fetchDrivers();
  };

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
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Truck size={28} className="text-blue-600" />
              Manajemen Pengiriman
            </h1>
            <p className="text-gray-600 text-md">
              Kelola dan pantau status pengiriman cold chain
            </p>
          </div>

          {/* Controls Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Filter size={16} className="inline mr-1" />
                    Filter Status:
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-gray-700 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {deliveryStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-gray-500">
                  <p>
                    Total pengiriman:{" "}
                    <span className="font-medium text-gray-700">
                      {deliveries.length}
                    </span>
                  </p>
                  <p>
                    Driver tersedia:{" "}
                    <span className="font-medium text-gray-700">
                      {drivers.length}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Deliveries Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Daftar Pengiriman
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <RefreshCw
                    size={32}
                    className="animate-spin text-blue-600 mx-auto mb-2"
                  />
                  <p className="text-gray-500">Memuat data pengiriman...</p>
                </div>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-12">
                <Truck size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Tidak Ada Pengiriman
                </h3>
                <p className="text-gray-500">
                  Belum ada data pengiriman untuk filter yang dipilih.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        ID Pengiriman
                      </th>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        <User size={16} className="inline mr-1" />
                        Driver
                      </th>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        <Calendar size={16} className="inline mr-1" />
                        Tanggal
                      </th>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        ID Container
                      </th>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        Status Kualitas
                      </th>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        <Thermometer size={16} className="inline mr-1" />
                        Threshold Suhu
                      </th>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        <Clock size={16} className="inline mr-1" />
                        Waktu Rencana
                      </th>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        <Clock size={16} className="inline mr-1" />
                        Waktu Aktual
                      </th>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        <MapPin size={16} className="inline mr-1" />
                        Lokasi Pickup
                      </th>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        <MapPin size={16} className="inline mr-1" />
                        Lokasi Tujuan
                      </th>
                      <th className="border-b border-gray-200 p-4 text-left text-sm font-medium text-gray-700">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => {
                      return (
                        <tr
                          key={delivery.id_delivery}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="border-b border-gray-100 p-4 text-sm font-medium text-gray-800">
                            DEL-{String(delivery.id_delivery).padStart(3, "0")}
                          </td>
                          <td className="border-b border-gray-100 p-4">
                            <div className="flex items-center gap-2">
                              {delivery.drivers ? (
                                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                  {delivery.drivers.name}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  Belum ditentukan
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="border-b border-gray-100 p-4 text-sm text-gray-800">
                            {dayjs(delivery.plan_date).format("DD/MM/YYYY")}
                          </td>
                          <td className="border-b border-gray-100 p-4">
                            <div
                              className={getStatusBadge(
                                delivery.delivery_status
                              )}
                            >
                              {getStatusIcon(delivery.delivery_status)}
                              {getStatusText(delivery.delivery_status)}
                            </div>
                          </td>
                          <td className="border-b border-gray-100 p-4 text-sm text-gray-800">
                            {delivery.id_container ? (
                              <span className="bg-gray-50 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                {delivery.id_container}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                Belum ditentukan
                              </span>
                            )}
                          </td>
                          <td className="border-b border-gray-100 p-4 text-sm text-gray-800">
                            {delivery.quality_status ? (
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  delivery.quality_status === "good"
                                    ? "bg-green-50 text-green-700"
                                    : delivery.quality_status === "warning"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : delivery.quality_status === "critical"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-gray-50 text-gray-700"
                                }`}
                              >
                                {delivery.quality_status}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                Belum dimonitor
                              </span>
                            )}
                          </td>
                          <td className="border-b border-gray-100 p-4 text-sm text-gray-800">
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                              {delivery.temperature_threshold}°C
                            </span>
                          </td>
                          <td className="border-b border-gray-100 p-4 text-sm text-gray-600">
                            <div className="space-y-1">
                              <div>
                                <span className="text-xs text-gray-500">
                                  Mulai:
                                </span>{" "}
                                {delivery.plan_start_time
                                  ? dayjs(delivery.plan_start_time).format(
                                      "HH:mm"
                                    )
                                  : "Belum dijadwalkan"}
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">
                                  Selesai:
                                </span>{" "}
                                {delivery.plan_end_time
                                  ? dayjs(delivery.plan_end_time).format(
                                      "HH:mm"
                                    )
                                  : "Belum dijadwalkan"}
                              </div>
                            </div>
                          </td>
                          <td className="border-b border-gray-100 p-4 text-sm text-gray-600">
                            <div className="space-y-1">
                              <div>
                                <span className="text-xs text-gray-500">
                                  Mulai:
                                </span>{" "}
                                {delivery.start_time
                                  ? dayjs(delivery.start_time).format("HH:mm")
                                  : "Belum dimulai"}
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">
                                  Selesai:
                                </span>{" "}
                                {delivery.end_time
                                  ? dayjs(delivery.end_time).format("HH:mm")
                                  : "Belum selesai"}
                              </div>
                            </div>
                          </td>
                          <td className="border-b border-gray-100 p-4 text-sm text-gray-600">
                            <div className="space-y-1">
                              <div>Lat: {delivery.depart_lat}</div>
                              <div>Lon: {delivery.depart_lon}</div>
                            </div>
                          </td>
                          <td className="border-b border-gray-100 p-4 text-sm text-gray-600">
                            <div className="space-y-1">
                              <div>Lat: {delivery.arrive_lat}</div>
                              <div>Lon: {delivery.arrive_lon}</div>
                            </div>
                          </td>
                          <td className="border-b border-gray-100 p-4">
                            <button
                              onClick={() => openModal(delivery)}
                              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <User size={14} />
                              Lihat Selengkapnya
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Delivery Details */}
      {isModalOpen && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Detail Pengiriman DEL-{String(selectedDelivery.id_delivery).padStart(3, "0")}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Pengiriman
                  </label>
                  <input
                    type="text"
                    value={`DEL-${String(selectedDelivery.id_delivery).padStart(3, "0")}`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Rencana
                  </label>
                  <input
                    type="text"
                    value={dayjs(selectedDelivery.plan_date).format("DD/MM/YYYY")}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Pengiriman
                  </label>
                  <div className={getStatusBadge(selectedDelivery.delivery_status)}>
                    {getStatusIcon(selectedDelivery.delivery_status)}
                    {getStatusText(selectedDelivery.delivery_status)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Threshold Suhu
                  </label>
                  <input
                    type="text"
                    value={`${selectedDelivery.temperature_threshold}°C`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Container
                  </label>
                  <input
                    type="text"
                    value={selectedDelivery.id_container || "Belum ditentukan"}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Kualitas
                  </label>
                  <input
                    type="text"
                    value={selectedDelivery.quality_status || "Belum dimonitor"}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              {/* Editable Fields */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Data yang dapat diubah
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User size={16} className="inline mr-1" />
                      Driver
                    </label>
                    <select
                      value={formData.id_driver}
                      onChange={(e) =>
                        setFormData({ ...formData, id_driver: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih Driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock size={16} className="inline mr-1" />
                      Jam Mulai Rencana
                    </label>
                    <input
                      type="time"
                      value={formData.plan_start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, plan_start_time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock size={16} className="inline mr-1" />
                      Jam Selesai Rencana
                    </label>
                    <input
                      type="time"
                      value={formData.plan_end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, plan_end_time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Informasi Lokasi
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-1" />
                      Lokasi Pickup
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={`Latitude: ${selectedDelivery.depart_lat}`}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                      />
                      <input
                        type="text"
                        value={`Longitude: ${selectedDelivery.depart_lon}`}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-1" />
                      Lokasi Tujuan
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={`Latitude: ${selectedDelivery.arrive_lat}`}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                      />
                      <input
                        type="text"
                        value={`Longitude: ${selectedDelivery.arrive_lon}`}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actual Times */}
              {(selectedDelivery.start_time || selectedDelivery.end_time) && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Waktu Aktual
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Waktu Mulai Aktual
                      </label>
                      <input
                        type="text"
                        value={selectedDelivery.start_time ? dayjs(selectedDelivery.start_time).format("DD/MM/YYYY HH:mm") : "Belum dimulai"}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Waktu Selesai Aktual
                      </label>
                      <input
                        type="text"
                        value={selectedDelivery.end_time ? dayjs(selectedDelivery.end_time).format("DD/MM/YYYY HH:mm") : "Belum selesai"}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
