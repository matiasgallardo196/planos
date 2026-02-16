"use client";

import { Room, RoomStatus } from "@/types";
import { useState } from "react";
import { X } from "lucide-react";

interface RoomModalProps {
  room: Room;
  onSave: (roomId: string, status: RoomStatus, occupantName?: string) => void;
  onClose: () => void;
}

export default function RoomModal({ room, onSave, onClose }: RoomModalProps) {
  const [status, setStatus] = useState<RoomStatus>(room.status || "FREE");
  const [occupantName, setOccupantName] = useState((room.occupants && room.occupants.length > 0 && room.occupants[0].name) || "");

  const handleSave = () => {
    onSave(room.id, status, status === "OCCUPIED" ? occupantName : undefined);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-96 max-w-full m-4 overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg">Room {room.label}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(["FREE", "OCCUPIED", "OOS"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2 px-3 rounded text-sm font-medium border ${
                    status === s 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {status === "OCCUPIED" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupant Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={occupantName}
                onChange={(e) => setOccupantName(e.target.value)}
                placeholder="Enter guest name"
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded">Save</button>
        </div>
      </div>
    </div>
  );
}


