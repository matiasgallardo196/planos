export interface Point {
  x: number;
  y: number;
}

export type RoomStatus = "FREE" | "OCCUPIED" | "OOS";

export interface Occupant {
  name: string;
  [key: string]: any;
}

export interface Room {
  id: string;
  label: string;
  hotelId: string;
  status: RoomStatus;
  polygon: Point[] | null;
  occupants: Occupant[] | null;
}

export interface Hotel {
  id: string;
  name: string;
  floorPlanUrl: string;
  createdAt: string;
  rooms?: Room[];
}
