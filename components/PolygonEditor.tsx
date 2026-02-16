"use client";

import { useState, useEffect } from "react";
import { Point } from "@/lib/storage";
import { getSvgCoordinates } from "@/lib/geometry";
import { Save, RotateCcw, X, Check } from "lucide-react";

interface PolygonEditorProps {
  roomId: string; // The room currently being edited
  initialPoints?: Point[];
  onSave: (points: Point[]) => void;
  onCancel: () => void;
}

export default function PolygonEditor({ initialPoints, onSave, onCancel }: PolygonEditorProps) {
  const [points, setPoints] = useState<Point[]>(initialPoints || []);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  
  // Convert points to SVG polygon points string
  const pointsString = points.map(p => `${p.x},${p.y}`).join(" ");

  const handleSvgClick = (e: React.MouseEvent) => {
    // If dragging, don't add point
    if (dragIndex !== null) return;
    
    // Don't add point if clicking on a handle (this is handled by handleMouseDown on circle)
    if ((e.target as Element).tagName === "circle") return;

    const svg = (e.currentTarget as unknown as SVGGraphicsElement).ownerSVGElement;
    if (!svg) return;
    const point = getSvgCoordinates(e, svg as SVGSVGElement);
    setPoints([...points, point]);
  };

  const handleUndo = () => {
    setPoints(points.slice(0, -1));
  };

  const handleClear = () => {
    setPoints([]);
  };

  // Dragging logic
  const handleMouseDown = (index: number) => {
    setDragIndex(index);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const svg = (e.currentTarget as unknown as SVGGraphicsElement).ownerSVGElement;
    if (!svg) return;
    const point = getSvgCoordinates(e, svg as SVGSVGElement);
    setMousePos(point);

    if (dragIndex === null) return;
    
    const newPoints = [...points];
    newPoints[dragIndex] = point;
    setPoints(newPoints);
  };

  const handleMouseUp = () => {
    setDragIndex(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
        if (e.key === "Enter") onSave(points);
        if (e.ctrlKey && e.key === "z") handleUndo();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [points, onCancel, onSave]);

  const isComplete = points.length >= 3;

  return (
    <g>
      {/* Interaction Layer - Invisible Rect to catch clicks */}
      <rect
        width="100%"
        height="100%"
        fill="transparent"
        onClick={handleSvgClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
            handleMouseUp();
            setMousePos(null);
        }}
        style={{ cursor: "crosshair" }}
      />

      {/* Preview Line (from last point to mouse) */}
      {points.length > 0 && mousePos && (
        <line
            x1={points[points.length - 1].x}
            y1={points[points.length - 1].y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.6"
            className="pointer-events-none"
        />
      )}

      {/* Closing Line Preview (from mouse to first point) - "Snap to close" effect */}
      {points.length > 2 && mousePos && (
         <line
            x1={mousePos.x}
            y1={mousePos.y}
            x2={points[0].x}
            y2={points[0].y}
             stroke="rgba(59, 130, 246, 0.3)"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.4"
            className="pointer-events-none"
        />
      )}


      {/* The Polygon being drawn */}
      {points.length > 0 && (
        <polygon
          points={pointsString}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
          className="pointer-events-none"
        />
      )}

      {/* Handles */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === 0 && points.length > 2 ? 8 : 6} // Larger start point when draggable
          fill={i === 0 ? "#2563eb" : "white"}
          stroke="#3b82f6"
          strokeWidth="2"
          className="cursor-pointer hover:r-8 transition-all"
          onMouseDown={(e) => {
            e.stopPropagation(); 
            // If clicking the first point and we have a valid polygon, close it (save).
            if (i === 0 && points.length >= 3) {
                 onSave(points);
            } else {
                handleMouseDown(i);
            }
          }}
        >
             {i === 0 && points.length >= 3 && <title>Click to close shape</title>}
        </circle>
      ))}

      {/* Editor Controls */}
       <foreignObject x="20" y="20" width="320" height="60">
        <div className="flex flex-col gap-1">
             <div className="flex gap-2 bg-white p-2 rounded-lg shadow-xl border border-gray-200" onMouseDown={e => e.stopPropagation()}>
                <button onClick={handleUndo} className="p-2 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 flex items-center gap-1 border border-gray-200" title="Undo (Ctrl+Z)">
                    <RotateCcw size={14}/> 
                </button>
                <button onClick={handleClear} className="p-2 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 flex items-center gap-1 border border-gray-200" title="Clear All">
                    <X size={14}/> 
                </button>
                 <div className="w-px bg-gray-200 mx-1"></div>
                <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200">
                    Cancel (Esc)
                </button>
                 <button 
                    onClick={() => onSave(points)} 
                    disabled={!isComplete}
                    className={`px-3 py-1.5 text-xs font-medium text-white rounded flex items-center gap-1 shadow-sm transition-colors ${isComplete ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                    <Check size={14}/> Save Shape
                </button>
            </div>
            <div className="text-[10px] text-gray-500 bg-white/80 px-2 py-0.5 rounded self-start backdrop-blur-sm">
                Click {points.length > 0 ? "to add points" : "map to start"} • {points.length >= 3 ? "Click start point to close" : ""}
            </div>
        </div>
      </foreignObject>
    </g>
  );
}
