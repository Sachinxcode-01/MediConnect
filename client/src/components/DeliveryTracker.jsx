import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Delivery vehicle icon
const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2950/2950796.png', // A generic delivery scooter or car icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const DeliveryTracker = ({ source, destination, onStatusUpdate }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !source || !destination) return;

    // Remove old routing controls if any
    const existingControls = document.querySelectorAll('.leaflet-routing-container');
    existingControls.forEach(el => el.remove());

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(source.lat, source.lng),
        L.latLng(destination.lat, destination.lng) // User location
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#10B981', weight: 6, opacity: 0.8 }] // theme-primary color
      },
      createMarker: () => null // Hide default markers to avoid clutter
    }).addTo(map);

    let driverMarker;
    let timeoutId;

    routingControl.on('routesfound', function(e) {
      const routes = e.routes;
      const summary = routes[0].summary;
      const coordinates = routes[0].coordinates;
      
      const totalDist = (summary.totalDistance / 1000).toFixed(1);
      const totalTime = Math.round(summary.totalTime % 3600 / 60);

      onStatusUpdate({
        distance: totalDist + ' km',
        time: totalTime + ' min',
        status: 'Preparing Order'
      });

      // Add driver marker at source (pharmacy)
      driverMarker = L.marker([source.lat, source.lng], { icon: deliveryIcon, zIndexOffset: 1000 }).addTo(map);

      let index = 0;
      const moveDriver = () => {
        if (index < coordinates.length) {
          const coord = coordinates[index];
          driverMarker.setLatLng([coord.lat, coord.lng]);
          
          const percent = index / coordinates.length;
          let statusText = 'On the way';
          if (percent < 0.1) statusText = 'Picked up';
          else if (percent > 0.9) statusText = 'Arriving soon';
          
          if (index % 5 === 0) {
             onStatusUpdate(prev => ({ ...prev, status: statusText }));
          }

          index += 1; // Animation speed step
          timeoutId = setTimeout(moveDriver, 200); // 100ms interval for smooth movement
        } else {
             onStatusUpdate(prev => ({ ...prev, status: 'Delivered!' }));
        }
      };

      // Start movement simulation after 2 seconds
      timeoutId = setTimeout(moveDriver, 2000);
    });

    return () => {
      clearTimeout(timeoutId);
      if (driverMarker) {
        map.removeLayer(driverMarker);
      }
      try {
         map.removeControl(routingControl);
      } catch (err) {}
    };
  }, [map, source, destination, onStatusUpdate]);

  return null;
};

export default DeliveryTracker;
