"use client";

import { useRef, useState, useEffect } from "react";
import { Room, RoomState, Polygon, Point } from "@/lib/storage";
import PolygonEditor from "./PolygonEditor";
import { clsx } from "clsx";

interface FloorPlanProps {
  imageSrc: string;
  rooms: Room[];
  polygons: Polygon[];
  states: RoomState[];
  selectedRoomId: string | null;
  editMode: boolean; // boolean: true = EDIT, false = VIEW
  onPolygonSave: (points: Point[]) => void;
  onRoomSelect: (roomId: string) => void;
}

export default function FloorPlan({
  imageSrc,
  rooms,
  polygons,
  states,
  selectedRoomId,
  editMode,
  onPolygonSave,
  onRoomSelect,
}: FloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

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


  const getPolygonColor = (roomId: string) => {
    const isSelected = selectedRoomId === roomId;
    const state = states.find(s => s.roomId === roomId)?.status || "FREE";
    
    if (isSelected) return "rgba(59, 130, 246, 0.5)"; // Blue
    
    switch (state) {
      case "OCCUPIED": return "rgba(34, 197, 94, 0.4)"; // Green
      case "OOS": return "rgba(234, 179, 8, 0.4)"; // Yellow
      case "FREE": return "rgba(255, 255, 255, 0.1)"; // Almost transparent
      default: return "transparent";
    }
  };

  const getPolygonStroke = (roomId: string) => {
     const isSelected = selectedRoomId === roomId;
     if (isSelected) return "#2563eb";
     return "#9ca3af";
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
          className="absolute inset-0 pointer-events-none"
          width="100%"
          height="100%"
          // We use standard coordinates; viewBox matches pixel size of overlay for simplicity
          // or we could use a fixed viewBox. For drawing simplicity, 1:1 pixel mapping is easiest.
          // However, if we resize, we need to handle that. 
          // The best approach for responsive drawings is to use a fixed viewBox (e.g. original image dimensions).
          // Since we don't know original image dims, we rely on the implementation to save absolute coords 
          // relative to current view or normalized. 
          // For MVP: We assume the user draws on the screen and we save those coords. 
          // CAUTION: If the image resizes (responsive), absolute coords will break.
          // OPTION: convert to % or use generic 1000x1000 coordinate system.
          // DECISION: To keep MVP simple, we will assume fixed viewBox 1000x1000 and simple transforms?
          // NO, simpler: Render SVG with no viewBox (pixel coords) but rely on `getSvgCoordinates` which handles CTM.
          // Re-drawing on resize will be an issue if we don't use viewBox.
          // FIX: scaling.
          viewBox={dimensions.width > 0 ? `0 0 ${dimensions.width} ${dimensions.height}` : undefined}
          style={{ pointerEvents: editMode ? "all" : "none" }}
        >
          {/* Render Existing Polygons */}
          {polygons.map((poly) => {
             // If we are editing this specific room strings
             if (editMode && selectedRoomId === poly.roomId) return null; // Don't show the saved one if we are editing it? 
             // Actually, if we are editing, we usually want to start from scratch or edit handles. 
             // The PolygonEditor takes `initialPoints`.
             
             const pointsStr = poly.points.map(p => `${p.x},${p.y}`).join(" ");
             return (
               <polygon
                 key={poly.roomId}
                 points={pointsStr}
                 fill={getPolygonColor(poly.roomId)}
                 stroke={getPolygonStroke(poly.roomId)}
                 strokeWidth="2"
                 className={clsx("transition-all", !editMode && "cursor-pointer hover:opacity-80 pointer-events-auto")}
                 onClick={(e) => {
                    if (!editMode) {
                        e.stopPropagation();
                        onRoomSelect(poly.roomId);
                    }
                 }}
               >
                 {!editMode && (
                    <title>
                        {rooms.find(r=>r.id===poly.roomId)?.label} - {states.find(s=>s.roomId===poly.roomId)?.status}
                         {states.find(s=>s.roomId===poly.roomId)?.occupantName ? ` (${states.find(s=>s.roomId===poly.roomId)?.occupantName})` : ''}
                    </title>
                 )}
               </polygon>
             )
          })}

          {/* Editor Overlay */}
          {editMode && selectedRoomId && (
            <PolygonEditor
              roomId={selectedRoomId}
              initialPoints={polygons.find(p => p.roomId === selectedRoomId)?.points}
              onSave={onPolygonSave}
              onCancel={() => {}} // User can just click away or click "Undo" inside editor
            />
          )}
        </svg>
      </div>
      
      {/* Help text */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow text-sm font-medium z-10 pointer-events-none">
        {editMode 
          ? selectedRoomId 
             ? "Edit Mode: Draw polygon (Click to add points, Drag handles)" 
             : "Edit Mode: Select a room to map"
          : "View Mode: Click rooms to see details"}
      </div>
    </div>
  );
}
