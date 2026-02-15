export interface Room {
  id: string;
  label: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Polygon {
  roomId: string;
  points: Point[];
}

export type RoomStatus = "FREE" | "OCCUPIED" | "OOS";

export interface RoomState {
  roomId: string;
  status: RoomStatus;
  occupantName?: string;
}

const STORAGE_KEYS = {
  ROOMS: "hotel-map-rooms",
  POLYGONS: "hotel-map-polygons",
  STATES: "hotel-map-states",
};

export const storage = {
  getRooms: (): Room[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return data ? JSON.parse(data) : [];
  },

  saveRooms: (rooms: Room[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  },

  getPolygons: (): Polygon[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.POLYGONS);
    return data ? JSON.parse(data) : [];
  },

  savePolygons: (polygons: Polygon[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.POLYGONS, JSON.stringify(polygons));
  },

  getStates: (): RoomState[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.STATES);
    return data ? JSON.parse(data) : [];
  },

  saveStates: (states: RoomState[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.STATES, JSON.stringify(states));
  },

  clearAll: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.POLYGONS);
    localStorage.removeItem(STORAGE_KEYS.STATES);
  },
};
