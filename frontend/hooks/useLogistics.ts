"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export type ShipmentStatus = "processing" | "in_transit" | "delivered" | "delayed";

export type Shipment = {
  id: string;
  order_id: string;
  retailer_name: string;
  destination: string;
  status: ShipmentStatus;
  eta: string;
  carrier: string;
};

export type LogisticsPartner = {
  id: string;
  name: string;
  reliability_score: number;
  active_shipments: number;
};

export type LogisticsResponse = {
  active_shipments: number;
  delayed_shipments: number;
  delivered_today: number;
  shipments: Shipment[];
  partners: LogisticsPartner[];
};

const mockShipments: Shipment[] = [
  {
    id: "shp-001",
    order_id: "ord-881",
    retailer_name: "Toko Budi Jaya",
    destination: "Jakarta Selatan",
    status: "in_transit",
    eta: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    carrier: "GoBox Logistics",
  },
  {
    id: "shp-002",
    order_id: "ord-882",
    retailer_name: "Cafe Senja",
    destination: "Bandung",
    status: "delayed",
    eta: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    carrier: "JNE Trucking",
  },
  {
    id: "shp-003",
    order_id: "ord-883",
    retailer_name: "Restoran Nusantara",
    destination: "Surabaya",
    status: "processing",
    eta: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    carrier: "Deliveree",
  },
];

export function useLogistics() {
  return useQuery({
    queryKey: ["logistics"],
    queryFn: async (): Promise<LogisticsResponse> => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        return {
          active_shipments: 42,
          delayed_shipments: 3,
          delivered_today: 15,
          shipments: mockShipments,
          partners: [
            { id: "p1", name: "GoBox Logistics", reliability_score: 98, active_shipments: 12 },
            { id: "p2", name: "Deliveree", reliability_score: 95, active_shipments: 8 },
            { id: "p3", name: "JNE Trucking", reliability_score: 89, active_shipments: 22 },
          ],
        };
      }
      const { data } = await api.get<ApiResponse<LogisticsResponse>>("/logistics/shipments");
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}
