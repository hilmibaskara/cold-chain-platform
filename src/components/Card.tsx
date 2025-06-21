import React from 'react';

interface DeliveryStep {
  time: string;
  description: string;
  isCompleted: boolean;
  isEstimated?: boolean;
}

export interface DeliveryCardProps {
  deliveryNumber: string;
  date: string;
  status: 'In Transit' | 'Riwayat' | 'Rencana' | 'Cancelled';
  coolboxId: string;
  driver: string;
  temperatureThreshold: string;
  currentTemperature: number;
  temperatureStatus: string;
  steps: DeliveryStep[];
  onViewDetails?: () => void;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({
  deliveryNumber,
  date,
  status,
  coolboxId,
  driver,
  temperatureThreshold,
  currentTemperature,
  temperatureStatus,
  steps,
  onViewDetails
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Transit':
        return 'bg-blue-500';
      case 'Delivered':
        return 'bg-green-500';
      case 'Pending':
        return 'bg-yellow-500';
      case 'Cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTemperatureStatusColor = (status: string) => {
    if (status.includes('lonjakan')) {
      return 'text-orange-600';
    }
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-xl border border-blue-200 p-3 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm">#{deliveryNumber}</h2>
            <span className={`px-2 py-0.5 text-xs rounded-full text-white ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
          <p className="text-gray-500 text-xs">{date}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Suhu:</p>
          <p className="font-bold text-lg text-blue-600 leading-none">{currentTemperature}°C</p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-1 mb-2 text-xs">
        <div>
          <p className="text-gray-500">Coolbox</p>
          <p className="font-medium">{coolboxId}</p>
        </div>
        <div>
          <p className="text-gray-500">Driver</p>
          <p className="font-medium">{driver}</p>
        </div>
        <div>
          <p className="text-gray-500">Threshold Suhu</p>
          <p className="font-medium">{temperatureThreshold}</p>
        </div>
      </div>
      
      {/* Temperature Status */}
      <div className="mb-2 text-xs">
        <span className={`${getTemperatureStatusColor(temperatureStatus)}`}>{temperatureStatus}</span>
      </div>

      {/* Timeline - Simplified */}
      <div className="mb-2 text-xs">
        <div className="flex gap-1 items-center">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <p className="text-gray-700">
            {steps[0]?.time} {steps[0]?.description}
          </p>
        </div>
        <div className="flex gap-1 items-center">
          <div className={`w-2 h-2 rounded-full ${steps[steps.length-1]?.isCompleted ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          <p className={`${steps[steps.length-1]?.isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
            {steps[steps.length-1]?.time} {steps[steps.length-1]?.description}
          </p>
        </div>
      </div>

      {/* View Details Link */}
      <button 
        onClick={onViewDetails}
        className="w-full py-1 text-xs text-center text-blue-600 hover:underline"
      >
        Detail &gt;
      </button>
    </div>
  );
};

export default DeliveryCard;