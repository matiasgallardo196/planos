"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Hotel } from "@/types";
import Link from "next/link";
import { Plus, Hotel as HotelIcon, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  // New Hotel Form State
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const res = await api.get<Hotel[]>("/hotels");
      
      if (Array.isArray(res.data)) {
        setHotels(res.data);
      } else {
        console.error("Unexpected API response format:", res.data);
        setHotels([]);
      }
    } catch (error) {
      console.error("Failed to load hotels", error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<Hotel>("/hotels", {
        name: newName,
        floorPlanUrl: newUrl
      });
      setHotels([res.data, ...hotels]);
      setShowCreate(false);
      setNewName("");
      setNewUrl("");
    } catch (error) {
      console.error("Failed to create hotel", error);
      alert("Failed to create hotel");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hotel Plans</h1>
            <p className="text-gray-500 mt-2">Manage your hotel floor plans and room occupancy</p>
          </div>
          <button 
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Plus size={20} /> New Hotel
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
             <h2 className="text-xl font-bold mb-4 text-gray-800">Register New Hotel</h2>
             <form onSubmit={handleCreateHotel} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                   <input 
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Grand Plaza Hotel"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Floor Plan Image URL</label>
                   <input 
                      required
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="https://..."
                   />
                   <p className="text-xs text-gray-500 mt-1">Direct link to an image (PNG, JPG)</p>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                   <button 
                     type="button" 
                     onClick={() => setShowCreate(false)}
                     className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit"
                     className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium shadow-sm"
                   >
                     Create Hotel
                   </button>
                </div>
             </form>
          </div>
        )}

        {/* Hotel Grid */}
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
           </div>
        ) : hotels.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <HotelIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900">No hotels yet</h3>
              <p className="text-gray-500 mt-2">Create your first hotel to get started</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <Link 
                key={hotel.id} 
                href={`/hotels/${hotel.id}`}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:border-blue-300 flex flex-col"
              >
                <div className="h-48 overflow-hidden bg-gray-100 relative border-b border-gray-100">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img 
                     src={hotel.floorPlanUrl} 
                     alt={hotel.name}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                   />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                    {hotel.name}
                  </h3>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                    <span className="text-xs text-gray-500">
                      Created {new Date(hotel.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center text-blue-600 text-sm font-medium">
                      Open Editor <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
