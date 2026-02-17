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
  showLabels: boolean;
  onPolygonSave: (points: Point[]) => void;
  onRoomSelect: (roomId: string) => void;
  onBackgroundClick?: () => void;
}

export default function FloorPlan({
  imageSrc,
  rooms,
  selectedRoomId,
  editMode,
  showLabels,
  onPolygonSave,
  onRoomSelect,
  onBackgroundClick,
}: FloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [drawingMode, setDrawingMode] = useState(false);

  // Track natural image dimensions — these define our coordinate system
  useEffect(() => {
    const updateDimensions = () => {
      const img = containerRef.current?.querySelector("img");
      if (img && img.naturalWidth) {
        setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };

    // We still listen to resize to trigger re-renders if needed
    window.addEventListener("resize", updateDimensions);
    
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
    <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-2 md:p-8 relative min-h-full">
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
         
         {/* SVG Overlay — viewBox uses NATURAL image dimensions so SVG auto-scales */}
         <svg
           className="absolute inset-0 pointer-events-auto"
           width="100%"
           height="100%"
           viewBox={naturalDimensions.width > 0 ? `0 0 ${naturalDimensions.width} ${naturalDimensions.height}` : undefined}
           preserveAspectRatio="none"
           style={{ pointerEvents: editMode ? "all" : "none" }}
           onClick={handleBackgroundClick}
         >
           {/* Background capture layer */}
           <rect width="100%" height="100%" fill="transparent" />
           {/* Render Existing Polygons — points are in natural image space, SVG scales them */}
           {rooms.map((room) => {
              if (!room.polygon || room.polygon.length === 0) return null;
              // If we are editing this specific room AND in drawing mode, hide the old polygon so we can redraw it
              if (editMode && drawingMode && selectedRoomId === room.id) return null; 
              
              // Points stored in natural coords render directly — SVG viewBox handles scaling
              const pointsStr = room.polygon.map(p => `${p.x},${p.y}`).join(" ");

              // Calculate center for text label
              const xInfo = room.polygon.reduce((acc, p) => ({ 
                  min: Math.min(acc.min, p.x), 
                  max: Math.max(acc.max, p.x) 
              }), { min: Infinity, max: -Infinity });
              const yInfo = room.polygon.reduce((acc, p) => ({ 
                  min: Math.min(acc.min, p.y), 
                  max: Math.max(acc.max, p.y) 
              }), { min: Infinity, max: -Infinity });
              
              const centerX = (xInfo.min + xInfo.max) / 2;
              const centerY = (yInfo.min + yInfo.max) / 2;

              // Determine text content
              let labelText = "Free";
              const status = (room.status || "FREE").toUpperCase();
              if (status === "OCCUPIED") {
                  labelText = room.occupants && room.occupants.length > 0 ? room.occupants[0].name : "Occupied";
              } else if (status === "OOS") {
                  labelText = "OOS";
              }

              // Dynamic font size based on image width to keep labels readable
              // default to 14, but scale up for large images (approx 1.5% of width)
              const fontSize = Math.max(12, naturalDimensions.width / 60);

              return (
                <g key={room.id}>
                    <polygon
                    points={pointsStr}
                    fill={getPolygonColor(room)}
                    stroke={getPolygonStroke(room)}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
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
                    {/* Label with background pill — two lines: room name + status */}
                    {!editMode && showLabels && (() => {
                        const smallFont = fontSize * 0.75;
                        const lineGap = fontSize * 0.3;
                        const totalH = fontSize + smallFont + lineGap;
                        const padX = fontSize * 0.6;
                        const padY = fontSize * 0.4;
                        const longerText = room.label.length > labelText.length ? room.label : labelText;
                        const textWidth = longerText.length * fontSize * 0.5;
                        const pillW = textWidth + padX * 2;
                        const pillH = totalH + padY * 2;
                        const rx = fontSize * 0.4;

                        // Top line (room label) y position
                        const topY = centerY - lineGap / 2 - smallFont / 2;
                        // Bottom line (status) y position  
                        const bottomY = centerY + lineGap / 2 + fontSize / 2;

                        return (
                          <g style={{ pointerEvents: "none" }}>
                            <rect
                              x={centerX - pillW / 2}
                              y={centerY - pillH / 2}
                              width={pillW}
                              height={pillH}
                              rx={rx}
                              ry={rx}
                              fill="rgba(0,0,0,0.7)"
                            />
                            {/* Room name */}
                            <text
                              x={centerX}
                              y={topY}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="rgba(255,255,255,0.8)"
                              fontSize={smallFont}
                              fontWeight="500"
                              fontFamily="system-ui, -apple-system, sans-serif"
                            >
                              {room.label}
                            </text>
                            {/* Status / Occupant */}
                            <text
                              x={centerX}
                              y={bottomY}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#fff"
                              fontSize={fontSize}
                              fontWeight="700"
                              fontFamily="system-ui, -apple-system, sans-serif"
                              letterSpacing="0.3"
                            >
                              {labelText}
                            </text>
                          </g>
                        );
                    })()}
                </g>
              )
           })}

           {/* Editor Overlay — getSvgCoordinates uses getScreenCTM().inverse() which
                automatically maps screen clicks to viewBox (natural) coordinate space */}
           {editMode && selectedRoomId && drawingMode && (
             <PolygonEditor
               roomId={selectedRoomId}
               initialPoints={existingPoints || undefined}
               onSave={(points) => {
                   // Points are already in natural image coords thanks to viewBox
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
       <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow text-xs md:text-sm font-medium z-10 pointer-events-none backdrop-blur-sm border border-gray-100 max-w-[90%] text-center">
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
