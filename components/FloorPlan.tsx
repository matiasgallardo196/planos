"use client";

import { useRef, useState, useEffect } from "react";
import { Room, Point } from "@/types";
import PolygonEditor from "./PolygonEditor";
import { clsx } from "clsx";
import { Pencil, Plus } from "lucide-react";

interface FloorPlanProps {
  imageSrc: string;
  rooms: Room[];
  selectedRoomId: string | null;
  editMode: boolean; // boolean: true = EDIT, false = VIEW
  onPolygonSave: (points: Point[]) => void;
  onRoomSelect: (roomId: string) => void;
  onBackgroundClick?: () => void;
}

export default function FloorPlan({
  imageSrc,
  rooms,
  selectedRoomId,
  editMode,
  onPolygonSave,
  onRoomSelect,
  onBackgroundClick,
}: FloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [drawingMode, setDrawingMode] = useState(false);

  // Handle resizing to keep SVG in sync with Image
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    window.addEventListener("resize", updateDimensions);
    
    // Initial load might need a delay for image
    const img = containerRef.current?.querySelector("img");
    if (img) {
      if (img.complete) updateDimensions();
      else img.onload = updateDimensions;
    }

    return () => window.removeEventListener("resize", updateDimensions);
  }, [imageSrc]);

  // Reset drawing mode when room selection changes or edit mode changes
  useEffect(() => {
    setDrawingMode(false);
  }, [selectedRoomId, editMode]);


  const getPolygonColor = (room: Room) => {
    const isSelected = selectedRoomId === room.id;
    const state = (room.status || "FREE").toUpperCase();
    
    if (isSelected) return "rgba(59, 130, 246, 0.6)"; // Blue (Selected)
    
    switch (state) {
      case "FREE": return "rgba(34, 197, 94, 0.5)"; // Green
      case "OCCUPIED": return "rgba(239, 68, 68, 0.5)"; // Red
      case "OOS": return "rgba(107, 114, 128, 0.5)"; // Grey
      default: return "transparent";
    }
  };

  const getPolygonStroke = (room: Room) => {
     const isSelected = selectedRoomId === room.id;
     const state = (room.status || "FREE").toUpperCase();

     if (isSelected) return "#2563eb"; // Blue-600

     switch (state) {
      case "FREE": return "#15803d"; // Green-700
      case "OCCUPIED": return "#b91c1c"; // Red-700
      case "OOS": return "#374151"; // Gray-700
      default: return "#9ca3af";
     }
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const existingPoints = selectedRoom?.polygon;

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only trigger if we clicked directly on the SVG or a background rect, not on a child
    if (e.target === e.currentTarget && onBackgroundClick) {
        onBackgroundClick();
    }
  };

  return (
    <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-8 relative">
       <div 
        ref={containerRef}
        className="relative shadow-xl border-4 border-white bg-white inline-block max-w-full"
        style={{ minWidth: "100px", minHeight: "100px" }} // Prevent collapse
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Floor Plan"
          className="block max-w-full h-auto"
          draggable={false}
        />
        
        {/* SVG Overlay */}
        <svg
          className="absolute inset-0 pointer-events-auto"
          width="100%"
          height="100%"
          viewBox={dimensions.width > 0 ? `0 0 ${dimensions.width} ${dimensions.height}` : undefined}
          style={{ pointerEvents: editMode ? "all" : "none" }}
          onClick={handleBackgroundClick}
        >
          {/* Background capture layer */}
          <rect width="100%" height="100%" fill="transparent" />
          {/* Render Existing Polygons */}
          {rooms.map((room) => {
             if (!room.polygon || room.polygon.length === 0) return null;
             // If we are editing this specific room AND in drawing mode, hide the old polygon so we can redraw it
             if (editMode && drawingMode && selectedRoomId === room.id) return null; 
             
             const pointsStr = room.polygon.map(p => `${p.x},${p.y}`).join(" ");
             return (
               <polygon
                 key={room.id}
                 points={pointsStr}
                 fill={getPolygonColor(room)}
                 stroke={getPolygonStroke(room)}
                 strokeWidth="2"
                 className={clsx("transition-all", !editMode && "cursor-pointer hover:opacity-80 pointer-events-auto")}
                 onClick={(e) => {
                    if (!editMode) {
                        e.stopPropagation();
                        onRoomSelect(room.id);
                    }
                 }}
               >
                 {!editMode && (
                    <title>
                        {room.label} - {room.status}
                         {room.occupants && room.occupants.length > 0 ? ` (${room.occupants[0].name})` : ''}
                    </title>
                 )}
               </polygon>
             )
          })}

          {/* Editor Overlay */}
          {editMode && selectedRoomId && drawingMode && (
            <PolygonEditor
              roomId={selectedRoomId}
              initialPoints={existingPoints || undefined} // Optional: Start with existing points if we want to edit instead of redraw
              onSave={(points) => {
                  onPolygonSave(points);
                  setDrawingMode(false);
              }}
              onCancel={() => setDrawingMode(false)}
            />
          )}
        </svg>

        {/* Start Drawing / Edit Button Overlay */}
        {editMode && selectedRoomId && !drawingMode && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <button 
                    onClick={() => setDrawingMode(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all font-medium animate-in fade-in zoom-in duration-200"
                >
                    {existingPoints && existingPoints.length > 0 ? <Pencil size={16} /> : <Plus size={16} />}
                    {existingPoints && existingPoints.length > 0 ? "Redraw Shape" : "Draw Shape"}
                </button>
            </div>
        )}
      </div>
      
      {/* Help text */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow text-sm font-medium z-10 pointer-events-none backdrop-blur-sm border border-gray-100">
        {editMode 
          ? selectedRoomId 
             ? drawingMode 
                ? "Drawing Mode: Click to add points. Click start to close."
                : `Selected: ${rooms.find(r => r.id === selectedRoomId)?.label || selectedRoomId}` 
             : "Edit Mode: Select a room from the list to map"
          : "View Mode: Click rooms to see details"}
      </div>
    </div>
  );
}


