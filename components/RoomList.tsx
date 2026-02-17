"use client";

import { useState } from "react";
import { Room } from "@/types";
import { Plus, Trash2, Download, Upload, Map, MapPinOff, X } from "lucide-react";
import { clsx } from "clsx";

interface RoomListProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (id: string) => void;
  onAddRoom: (label: string) => void;
  onDeleteRoom: (id: string) => void;
  onExport: () => void;
  onImport: (json: string) => void;
  className?: string;     // Allow overriding styles (width, position)
  onClose?: () => void;   // Optional close handler for mobile drawer
}

type Filter = "ALL" | "MAPPED" | "UNMAPPED" | "FREE" | "OCCUPIED" | "OOS";

export default function RoomList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onAddRoom,
  onDeleteRoom,
  onExport,
  onImport,
  className,
  onClose,
}: RoomListProps) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [newRoomLabel, setNewRoomLabel] = useState("");

  const filteredRooms = rooms.filter((room) => {
    const isMapped = !!room.polygon && room.polygon.length > 0;
    const state = room.status || "FREE";
    const matchesSearch = room.label.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case "MAPPED": return isMapped;
      case "UNMAPPED": return !isMapped;
      case "FREE": return state === "FREE";
      case "OCCUPIED": return state === "OCCUPIED";
      case "OOS": return state === "OOS";
      default: return true;
    }
  });

  const handleImport = () => {
    const json = prompt("Paste JSON here:");
    if (json) onImport(json);
  };

  return (
    <div className={clsx("flex flex-col h-full bg-gray-50 border-r border-gray-200 w-80 md:w-80", className)}>
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-lg font-bold">Rooms</h2>
           {onClose && (
             <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-100 rounded-full">
               <X size={20} />
             </button>
           )}
        </div>
        
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 px-3 py-2 border rounded text-sm min-w-0" // min-w-0 prevents input from overflowing flex container
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(["ALL", "MAPPED", "UNMAPPED", "FREE", "OCCUPIED", "OOS"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-2 py-1 text-xs rounded border",
                filter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 hover:bg-gray-100"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
           <input
            className="flex-1 px-3 py-2 border rounded text-sm min-w-0"
            placeholder="New Room Label"
            value={newRoomLabel}
            onChange={(e) => setNewRoomLabel(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && newRoomLabel) {
                    onAddRoom(newRoomLabel);
                    setNewRoomLabel("");
                }
            }}
          />
          <button
            onClick={() => {
              if (newRoomLabel) {
                onAddRoom(newRoomLabel);
                setNewRoomLabel("");
              }
            }}
            className="p-2 bg-green-600 text-white rounded hover:bg-green-700 shrink-0"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredRooms.map((room) => {
          const isMapped = !!room.polygon && room.polygon.length > 0;
          const status = room.status || "FREE";
          const occupantName = room.occupants && room.occupants.length > 0 ? room.occupants[0].name : null;
          
          return (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={clsx(
                "flex items-center justify-between p-3 rounded cursor-pointer border transition-colors",
                selectedRoomId === room.id
                  ? "bg-blue-50 border-blue-300 ring-1 ring-blue-300"
                  : "bg-white border-gray-100 hover:bg-gray-50",
                !isMapped && "opacity-75"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                 {isMapped ? <Map size={16} className="text-green-500 shrink-0" /> : <MapPinOff size={16} className="text-gray-400 shrink-0" />}
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{room.label}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {status} {occupantName ? `(${occupantName})` : ""}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm(`Delete room ${room.label}?`)) onDeleteRoom(room.id);
                }}
                className="text-gray-400 hover:text-red-500 p-1 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between">
        <button onClick={onExport} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <Download size={16} /> Export
        </button>
        <button onClick={handleImport} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <Upload size={16} /> Import
        </button>
      </div>
    </div>
  );
}


