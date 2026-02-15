"use client";

import { useState } from "react";
import { Point } from "@/lib/storage";
import { getSvgCoordinates } from "@/lib/geometry";
import { Save, RotateCcw, X } from "lucide-react";

interface PolygonEditorProps {
  roomId: string; // The room currently being edited
  initialPoints?: Point[];
  onSave: (points: Point[]) => void;
  onCancel: () => void;
}

export default function PolygonEditor({ initialPoints, onSave }: PolygonEditorProps) {
  const [points, setPoints] = useState<Point[]>(initialPoints || []);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  
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
    if (dragIndex === null) return;
    const svg = (e.currentTarget as unknown as SVGGraphicsElement).ownerSVGElement;
    if (!svg) return;
    const point = getSvgCoordinates(e, svg as SVGSVGElement);
    const newPoints = [...points];
    newPoints[dragIndex] = point;
    setPoints(newPoints);
  };

  const handleMouseUp = () => {
    setDragIndex(null);
  };

  return (
    <g>
        {/* Helper text/controls overlay - fixed position via foreignObject or just above SVG if possible, 
            but for now we assume this is part of the SVG structure */}
      
      {/* Interaction Layer - Invisible Rect to catch clicks */}
      <rect
        width="100%"
        height="100%"
        fill="transparent"
        onClick={handleSvgClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: "crosshair" }}
      />

      {/* The Polygon being drawn */}
      {points.length > 0 && (
        <polygon
          points={pointsString}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
          strokeWidth="2"
        />
      )}

      {/* Handles */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="6"
          fill="white"
          stroke="#3b82f6"
          strokeWidth="2"
          className="cursor-pointer hover:r-8 transition-all"
          onMouseDown={(e) => {
            e.stopPropagation(); // Prevent adding point
            handleMouseDown(i);
          }}
        />
      ))}

      {/* Basic Controls anchored to top-left of SVG or similar? 
          Actually, these controls are better placed in the HTML UI outside SVG to avoid scaling issues. 
          But the prompt asks for specific buttons. I'll pass a ref or portals, 
          BUT for simplicity I will render a ForeignObject or just let the parent handle the buttons.
          Wait, the prompt says "Botones: Undo point, Clear, Save polygon".
          I'll stick these in a localized control panel if possible, or expect Parent to render them.
          
          To make it self-contained, I'll return the logic only? No, component needs UI.
          I will render a foreignObject for the toolbar.
      */}
       <foreignObject x="10" y="10" width="300" height="50">
        <div className="flex gap-2 bg-white/90 p-2 rounded shadow-lg border border-gray-200">
            <button onClick={handleUndo} className="p-1 px-2 text-xs bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1">
                <RotateCcw size={12}/> Undo
            </button>
            <button onClick={handleClear} className="p-1 px-2 text-xs bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1">
                <X size={12}/> Clear
            </button>
             <button onClick={() => onSave(points)} className="p-1 px-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
                <Save size={12}/> Save
            </button>
        </div>
      </foreignObject>
    </g>
  );
}
