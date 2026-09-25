'use client';

import { useEffect, useRef, useState } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';

// Leaflet types (loaded via CDN in index.html)
declare global {
  interface Window {
    L: any;
  }
}

interface MapViewProps {
  onEventClick?: (eventId: string) => void;
}

export function MapView({ onEventClick }: MapViewProps) {
  const { events, people, categories } = useTimelineStore();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Filter events that have location coordinates
  const eventsWithLocation = events.filter(
    (e) => e.location?.lat != null && e.location?.lon != null
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!window.L) {
      console.error('Leaflet not loaded');
      return;
    }

    // Create map
    const map = window.L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    // Fix size issues
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add markers for events
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for each event with location
    eventsWithLocation.forEach((event) => {
      const category = categories.find((c) => c.name === event.category);
      const eventPeople = event.peopleIds
        ? people.filter((p) => event.peopleIds!.includes(p.id))
        : [];

      const lat = event.location!.lat!;
      const lon = event.location!.lon!;

      // Create circle marker
      const marker = window.L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: category?.color || '#6366f1',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      });

      // Tooltip on hover
      const tooltipContent = `
        <div>
          <strong>${event.title}</strong><br/>
          ${fmtDate(event.date_start, 'bcad', event.dateStartCertainty)}
          ${eventPeople.length > 0 ? `<br/>${eventPeople.map((p) => p.name).join(', ')}` : ''}
        </div>
      `;
      marker.bindTooltip(tooltipContent);

      // Click to open event panel
      marker.on('click', () => {
        if (onEventClick) {
          onEventClick(event.id);
        }
      });

      marker.addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (eventsWithLocation.length > 0) {
      const bounds = window.L.latLngBounds(
        eventsWithLocation.map((e) => [e.location!.lat!, e.location!.lon!])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [mapReady, eventsWithLocation, categories, people, onEventClick]);

  const handleFitAll = () => {
    if (!mapRef.current || eventsWithLocation.length === 0) return;
    const bounds = window.L.latLngBounds(
      eventsWithLocation.map((e) => [e.location!.lat!, e.location!.lon!])
    );
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  if (eventsWithLocation.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Events with Locations</h3>
          <p className="text-gray-400">
            Add location coordinates to your events to see them on the map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="tl-view-map" className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Map View</span>
          <span className="text-xs text-gray-500">
            {eventsWithLocation.length} event{eventsWithLocation.length !== 1 ? 's' : ''} with
            locations
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFitAll}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            Fit All
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="flex-1 relative bg-gray-800" />
    </div>
  );
}
