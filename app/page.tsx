"use client";

import { useEffect, useState } from "react";
import RoomList from "@/components/RoomList";
import FloorPlan from "@/components/FloorPlan";
import RoomModal from "@/components/RoomModal";
import { defaultRoomIds } from "@/data/defaultRooms";
import { 
  storage, 
  Room, 
  Polygon, 
  RoomState, 
  Point 
} from "@/lib/storage";
import { Pencil, Eye } from "lucide-react";

export default function Home() {
  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [states, setStates] = useState<RoomState[]>([]);
  
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false); // false = VIEW, true = EDIT
  const [isModalOpen, setIsModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [floorPlanSrc] = useState("https://res.cloudinary.com/dxhwv3byy/image/upload/v1771204343/plano_lug2rz.png"); // Default

  // Load Data
  useEffect(() => {
    // 1. Load Rooms
    const storedRooms = storage.getRooms();
    if (storedRooms.length > 0) {
      setRooms(storedRooms);
    } else {
      // Initialize default
      const defaults = defaultRoomIds.map(id => ({ id, label: id }));
      setRooms(defaults);
      storage.saveRooms(defaults);
    }

    // 2. Load Polygons & States
    setPolygons(storage.getPolygons());
    setStates(storage.getStates());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actions
  const handleAddRoom = (id: string) => {
    if (rooms.some(r => r.id === id)) return alert("Room ID already exists");
    const newRooms = [...rooms, { id, label: id }];
    setRooms(newRooms);
    storage.saveRooms(newRooms);
  };

  const handleDeleteRoom = (id: string) => {
    const newRooms = rooms.filter(r => r.id !== id);
    setRooms(newRooms);
    storage.saveRooms(newRooms);
    
    // Also remove polygon and state
    const newPolygons = polygons.filter(p => p.roomId !== id);
    setPolygons(newPolygons);
    storage.savePolygons(newPolygons);

    const newStates = states.filter(s => s.roomId !== id);
    setStates(newStates);
    storage.saveStates(newStates);
    
    if (selectedRoomId === id) setSelectedRoomId(null);
  };

  const handleSavePolygon = (points: Point[]) => {
    if (!selectedRoomId) return;
    const newPoly: Polygon = { roomId: selectedRoomId, points };
    
    // Remove existing if any
    const otherPolys = polygons.filter(p => p.roomId !== selectedRoomId);
    const newPolygons = [...otherPolys, newPoly];
    
    setPolygons(newPolygons);
    storage.savePolygons(newPolygons);
    // Don't exit edit mode automatically, user might want to adjust
  };

  const handleRoomSelect = (id: string) => {
    setSelectedRoomId(id);
    if (!editMode) {
      setIsModalOpen(true);
    }
  };

  const handleSaveState = (newState: RoomState) => {
    const otherStates = states.filter(s => s.roomId !== newState.roomId);
    const newStates = [...otherStates, newState];
    setStates(newStates);
    storage.saveStates(newStates);
  };

  const handleExport = () => {
    const data = { rooms, polygons, states };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hotel-map-data.json";
    a.click();
  };

  const handleImport = (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.rooms && data.polygons && data.states) {
        setRooms(data.rooms);
        setPolygons(data.polygons);
        setStates(data.states);
        storage.saveRooms(data.rooms);
        storage.savePolygons(data.polygons);
        storage.saveStates(data.states);
        alert("Import successful!");
      } else {
        alert("Invalid JSON format");
      }
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <RoomList
        rooms={rooms}
        polygons={polygons}
        states={states}
        selectedRoomId={selectedRoomId}
        onSelectRoom={handleRoomSelect}
        onAddRoom={handleAddRoom}
        onDeleteRoom={handleDeleteRoom}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Toolbar */}
        <div className="h-14 border-b bg-white flex items-center justify-between px-4 z-20 shadow-sm">
          <h1 className="font-bold text-xl">Hotel Map Editor</h1>
          
          <div className="flex items-center gap-4">
             {/* Mode Switcher */}
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setEditMode(false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!editMode ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Eye size={16} /> View
              </button>
              <button
                onClick={() => setEditMode(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${editMode ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Pencil size={16} /> Edit
              </button>
            </div>
            
            {/* Image Uploader helper (optional but useful) */}
             {/* For now, just a note or we can rely on file replacement */}
          </div>
        </div>

        {/* Workspace */}
        <FloorPlan
          imageSrc={floorPlanSrc}
          rooms={rooms}
          polygons={polygons}
          states={states}
          selectedRoomId={selectedRoomId}
          editMode={editMode}
          onPolygonSave={handleSavePolygon}
          onRoomSelect={handleRoomSelect}
          onBackgroundClick={() => setSelectedRoomId(null)}
        />
      </div>

      {/* Modal */}
      {isModalOpen && selectedRoomId && (
        <RoomModal
          room={rooms.find(r => r.id === selectedRoomId)!}
          currentState={states.find(s => s.roomId === selectedRoomId)}
          onSave={handleSaveState}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRoomId(null);
          }}
        />
      )}
    </main>
  );
}
