'use client';

import { useEffect, useRef, useState } from 'react';

interface JobMapProps {
  jobLocation: {
    lat: number;
    lng: number;
  };
  engineerLocation?: {
    lat: number;
    lng: number;
  } | null;
}

export function JobMap({ jobLocation, engineerLocation }: JobMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [jobMarker, setJobMarker] = useState<google.maps.Marker | null>(null);
  const [engineerMarker, setEngineerMarker] = useState<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts before loading
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
      const newMap = new google.maps.Map(mapRef.current, {
        center: jobLocation,
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(newMap);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }
  }, [isLoaded, jobLocation, map]);

  // Add/update job location marker
  useEffect(() => {
    if (!map) return;

    if (jobMarker) {
      jobMarker.setPosition(jobLocation);
    } else {
      const marker = new google.maps.Marker({
        position: jobLocation,
        map: map,
        title: 'Job Location',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: '<div style="padding: 8px;"><strong>Job Location</strong></div>',
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      setJobMarker(marker);
    }
  }, [map, jobLocation, jobMarker]);

  // Add/update engineer location marker
  useEffect(() => {
    if (!map) return;

    if (engineerLocation) {
      if (engineerMarker) {
        engineerMarker.setPosition(engineerLocation);
      } else {
        const marker = new google.maps.Marker({
          position: engineerLocation,
          map: map,
          title: 'Engineer Location',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: '<div style="padding: 8px;"><strong>Engineer Location</strong></div>',
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        setEngineerMarker(marker);
      }

      // Adjust map bounds to show both markers
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(jobLocation);
      bounds.extend(engineerLocation);
      map.fitBounds(bounds);
    } else if (engineerMarker) {
      // Remove engineer marker if location is no longer available
      engineerMarker.setMap(null);
      setEngineerMarker(null);
      
      // Center on job location
      map.setCenter(jobLocation);
      map.setZoom(13);
    }
  }, [map, engineerLocation, jobLocation, engineerMarker]);

  if (error) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-sm text-gray-600">
            Location: {jobLocation.lat.toFixed(6)}, {jobLocation.lng.toFixed(6)}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg" />
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center mb-2">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Job Location</span>
        </div>
        {engineerLocation && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Engineer Location</span>
          </div>
        )}
      </div>
    </div>
  );
}
