import { StyleSheet, Text, View, PermissionsAndroid } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { WebView } from 'react-native-webview';

const MapScreen = ({ route }) => {
  const { lat, lng, username } = route.params; // Extract destination lat, lng, and username
  const [currentLocation, setCurrentLocation] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Request location permission (Android)
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        console.warn("Location permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => console.warn(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // HTML for Leaflet map with route
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js"></script>
      <style>
        #map { height: 100vh; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${lat}, ${lng}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        var startMarker = L.marker([${currentLocation?.latitude || lat}, ${currentLocation?.longitude || lng}]).addTo(map)
          .bindPopup("Your Location").openPopup();

        var destinationMarker = L.marker([${lat}, ${lng}]).addTo(map)
          .bindPopup("${username}'s Location").openPopup();

        if (${currentLocation ? "true" : "false"}) {
          L.Routing.control({
            waypoints: [
              L.latLng(${currentLocation?.latitude}, ${currentLocation?.longitude}),
              L.latLng(${lat}, ${lng})
            ],
            routeWhileDragging: true
          }).addTo(map);
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        originWhitelist={["*"]}
      />
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({});
