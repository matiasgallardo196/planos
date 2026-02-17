"use client";

import { useEffect, useState, use } from "react";
import RoomList from "@/components/RoomList";
import FloorPlan from "@/components/FloorPlan";
import RoomModal from "@/components/RoomModal";
import api from "@/lib/api";
import { Hotel, Room, RoomStatus, Point } from "@/types";
import { Pencil, Eye, ArrowLeft, Menu, Tag, Tags } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function HotelEditor({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const { id } = use(params);

  // State
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false); // false = VIEW, true = EDIT
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    loadHotelData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadHotelData = async () => {
    try {
      setLoading(true);
      const [hotelRes, roomsRes] = await Promise.all([
        api.get<Hotel>(`/hotels/${id}`),
        api.get<Room[]>(`/hotels/${id}/rooms`),
      ]);
      setHotel(hotelRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error("Failed to load hotel data", error);
      alert("Failed to load hotel data");
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleAddRoom = async (label: string) => {
    try {
      const res = await api.post<Room>(`/hotels/${id}/rooms`, { label });
      setRooms([...rooms, res.data]);
    } catch (error) {
      console.error("Failed to create room", error);
      alert("Failed to create room");
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      setRooms(rooms.filter(r => r.id !== roomId));
      if (selectedRoomId === roomId) setSelectedRoomId(null);
    } catch (error) {
       console.error("Failed to delete room", error);
       alert("Failed to delete room");
    }
  };

  const handleSavePolygon = async (points: Point[]) => {
    if (!selectedRoomId) return;
    try {
      const res = await api.patch<Room>(`/rooms/${selectedRoomId}`, { polygon: points });
      setRooms(rooms.map(r => r.id === selectedRoomId ? res.data : r));
    } catch (error) {
      console.error("Failed to save polygon", error);
      alert("Failed to save polygon");
    }
  };

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (!editMode) {
      setIsModalOpen(true);
    }
  };

  const handleSaveState = async (roomId: string, status: RoomStatus, occupantName?: string) => {
     try {
       const res = await api.patch<Room>(`/rooms/${roomId}`, { 
           status, 
           occupants: occupantName ? [{ name: occupantName }] : [] 
       });
       setRooms(rooms.map(r => r.id === roomId ? res.data : r));
     } catch (error) {
       console.error("Failed to save state", error);
       alert("Failed to save state");
     }
  };

  const handleExport = () => {
    const data = { hotel, rooms };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hotel-${hotel?.name || 'data'}.json`;
    a.click();
  };

  const handleImport = async (json: string) => {
     // TODO: Implement Import logic if needed, might be complex with backend IDs
     alert("Import not implemented for backend storage yet");
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!hotel) return <div className="flex h-screen items-center justify-center">Hotel not found</div>;

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar - Desktop: Static, Mobile: Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out shadow-xl md:shadow-none`}
      >
        <RoomList
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={(id) => {
             handleRoomSelect(id);
             // On mobile, close sidebar after selection if you want, or keep open. 
             // Let's keep it open for now as they might want to select multiple or just see details.
             // Actually, usually you want to see the map after selecting.
             if (window.innerWidth < 768) setIsSidebarOpen(false); 
          }}
          onAddRoom={handleAddRoom}
          onDeleteRoom={handleDeleteRoom}
          onExport={handleExport}
          onImport={handleImport}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
      
      {/* Overlay for mobile drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
        {/* Toolbar */}
        <div className="h-14 border-b bg-white flex items-center justify-between px-4 z-20 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
             <button 
               className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600"
               onClick={() => setIsSidebarOpen(true)}
             >
               <Menu size={24} />
             </button>
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block">
                <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="font-bold text-lg md:text-xl truncate max-w-[150px] md:max-w-none">{hotel.name}</h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Mode Switcher */}
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setEditMode(false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${!editMode ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Eye size={16} /> <span className="hidden md:inline">View</span>
              </button>
              <button
                onClick={() => setEditMode(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${editMode ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Pencil size={16} /> <span className="hidden md:inline">Edit</span>
              </button>
            </div>

             {/* Labels Toggle */}
             <button
               onClick={() => setShowLabels(!showLabels)}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all border ${
                 showLabels 
                   ? 'bg-blue-50 border-blue-200 text-blue-600' 
                   : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600'
               }`}
               title={showLabels ? 'Hide labels' : 'Show labels'}
             >
               {showLabels ? <Tag size={16} /> : <Tags size={16} />}
               <span className="hidden md:inline">{showLabels ? 'Labels' : 'Labels'}</span>
             </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-auto relative">
            <FloorPlan
              imageSrc={hotel.floorPlanUrl}
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              editMode={editMode}
              showLabels={showLabels}
              onPolygonSave={handleSavePolygon}
              onRoomSelect={handleRoomSelect}
              onBackgroundClick={() => setSelectedRoomId(null)}
            />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedRoomId && (
        <RoomModal
          room={rooms.find(r => r.id === selectedRoomId)!}
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
