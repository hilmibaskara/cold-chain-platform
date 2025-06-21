// All delivery data in a single array
export const deliveries = [
  {
    deliveryNumber: "01234",
    date: "20 Juni 2025",
    status: "In Transit",
    coolboxId: "CB-01",
    driver: "Suhono",
    temperatureThreshold: "0 - 4 °C",
    currentTemperature: 2,
    temperatureStatus: "terjadi lonjakan suhu",
    steps: [
      {
        time: "10.00",
        description: "Pickup order #5678",
        isCompleted: true
      },
      {
        time: "",
        description: "Shipment",
        isCompleted: true
      },
      {
        time: "11.00",
        description: "Pickup order #5679",
        isCompleted: true,
        isEstimated: true
      },
      {
        time: "",
        description: "Shipment",
        isCompleted: false
      },
      {
        time: "12.00",
        description: "Arrival",
        isCompleted: false,
        isEstimated: true
      }
    ],
    onViewDetails: () => {
      alert('View details clicked!');
    }
  },
  {
    deliveryNumber: "01235",
    date: "20 Juni 2025",
    status: "Rencana",
    coolboxId: "CB-02",
    driver: "Budi",
    temperatureThreshold: "0 - 4 °C",
    currentTemperature: 3,
    temperatureStatus: "terjadi lonjakan suhu",
    steps: [
      {
        time: "10.00",
        description: "Pickup order #5678",
        isCompleted: true
      },
      {
        time: "",
        description: "Shipment",
        isCompleted: true
      },
      {
        time: "11.00",
        description: "Pickup order #5679",
        isCompleted: true,
        isEstimated: true
      },
      {
        time: "",
        description: "Shipment",
        isCompleted: false
      },
      {
        time: "12.00",
        description: "Arrival",
        isCompleted: false,
        isEstimated: true
      }
    ],
    onViewDetails: () => {
      alert('View details clicked!');
    }
  },
  {
    deliveryNumber: "01236",
    date: "20 Juni 2025",
    status: "Riwayat",
    coolboxId: "CB-03",
    driver: "Santoso",
    temperatureThreshold: "0 - 4 °C",
    currentTemperature: 1,
    temperatureStatus: "terjadi lonjakan suhu",
    steps: [
      {
        time: "10.00",
        description: "Pickup order #5678",
        isCompleted: true
      },
      {
        time: "",
        description: "Shipment",
        isCompleted: true
      },
      {
        time: "11.00",
        description: "Pickup order #5679",
        isCompleted: true,
        isEstimated: true
      },
      {
        time: "",
        description: "Shipment",
        isCompleted: false
      },
      {
        time: "12.00",
        description: "Arrival",
        isCompleted: false,
        isEstimated: true
      }
    ],
    onViewDetails: () => {
      alert('View details clicked!');
    }
  }
];