import React, { useEffect, useState, useRef } from "react";
import { View, TextInput, Button, StyleSheet, PermissionsAndroid, Alert, Image } from "react-native";
import { WebView } from "react-native-webview";
import Geolocation from "react-native-geolocation-service";
import CustomAlert from "./CustomAlert";

const LeafletMap = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(""); // User enters place name (not lat/lon)
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);
  const [redZones, setRedZones] = useState([]); // Stores red zones
  const [greenZones, setGreenZones] = useState([]); // Stores green zones (police stations)
  const [heatmapData, setHeatmapData] = useState([]); // Stores heatmap data
  const [pathCoordinates, setPathCoordinates] = useState([]); // Stores coordinates of the path

  const webViewRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const showAlert = (title, message, confirmCallback) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setOnConfirm(() => confirmCallback);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  // Request location permission (Android)
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        Alert.alert("Permission Denied", "Location access is required for navigation.");
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
        generateRedZones(position.coords.latitude, position.coords.longitude);
        generateGreenZones(position.coords.latitude, position.coords.longitude); // Generate police stations
        generateHeatmapData(position.coords.latitude, position.coords.longitude); // Generate crime heatmap
      },
      (error) => console.warn(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Generate random red zones around the current location
  const generateRedZones = (lat, lon) => {
    let zones = [];
    for (let i = 0; i < 5; i++) {
      let offsetLat = (Math.random() - 0.5) * 0.05; // Random offset
      let offsetLon = (Math.random() - 0.5) * 0.05;
      let redZone = {
        lat: lat + offsetLat,
        lon: lon + offsetLon
      };

      // Ensure red zone doesn't overlap with any green zone
      if (!isOverlappingWithGreenZones(redZone)) {
        zones.push(redZone);
      } else {
        i--; // Retry if the zone overlaps
      }
    }
    setRedZones(zones);
  };

  // Check if the red zone overlaps with any green zone
  const isOverlappingWithGreenZones = (redZone) => {
    return greenZones.some(greenZone => {
      const distance = Math.sqrt(Math.pow(greenZone.lat - redZone.lat, 2) + Math.pow(greenZone.lon - redZone.lon, 2));
      return distance < 0.01; // If the distance between zones is less than 0.01 degrees
    });
  };

  // Generate static green zones (police stations) around the current location
  const generateGreenZones = (lat, lon) => {
    const stations = [
      { lat: lat + 0.01, lon: lon + 0.01, name: "Police Station 1" },
      { lat: lat - 0.01, lon: lon - 0.02, name: "Police Station 2" },
      { lat: lat + 0.02, lon: lon - 0.01, name: "Police Station 3" }
    ];

    // Ensure green zones don't overlap with red zones
    const uniqueStations = stations.filter(station => !isOverlappingWithRedZones(station));
    setGreenZones(uniqueStations);
  };

  // Check if the green zone overlaps with any red zone
  const isOverlappingWithRedZones = (greenZone) => {
    return redZones.some(redZone => {
      const distance = Math.sqrt(Math.pow(redZone.lat - greenZone.lat, 2) + Math.pow(redZone.lon - greenZone.lon, 2));
      return distance < 0.01; // If the distance between zones is less than 0.01 degrees
    });
  };

  // Generate heatmap data points based on crime rate (simulate this data)
  const generateHeatmapData = (lat, lon) => {
    let heatData = [];
    for (let i = 0; i < 10; i++) {
      let offsetLat = (Math.random() - 0.5) * 0.05; // Random offset
      let offsetLon = (Math.random() - 0.5) * 0.05;
      let crimeIntensity = Math.random() * 0.5 + 0.5; // Random intensity between 0.5 and 1 (simulate crime data)
      heatData.push([lat + offsetLat, lon + offsetLon, crimeIntensity]);
    }
    setHeatmapData(heatData);
  };

  // Convert destination name into coordinates using OpenStreetMap Nominatim API
  const fetchCoordinates = async (placeName) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}`);
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0]; // Extract first result
        updateRoute(lat, lon);
      } else {
        showAlert("Location Not Found", "Please enter a valid location name.");
      }
    } catch (error) {
      showAlert("Error", "Failed to fetch location. Check your internet connection.");
    }
  };

  // Send route update command to WebView
  const updateRoute = (lat, lon) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`updateRoute(${lat}, ${lon});`);
    }
  };

  // WebView HTML with Leaflet map and routing
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js"></script>
      <script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script> <!-- Include Heatmap -->
      <style>
        #map { height: 100vh; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${currentLocation?.latitude || 51.505}, ${currentLocation?.longitude || -0.09}], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        
        var startMarker = L.marker([${currentLocation?.latitude || 51.505}, ${currentLocation?.longitude || -0.09}]).addTo(map)
          .bindPopup("Your Location").openPopup();

        var destinationMarker;
        var routingControl;

        // Function to add red zones
        function addRedZones() {
          var redZones = ${JSON.stringify(redZones)};
          redZones.forEach(zone => {
            L.circle([zone.lat, zone.lon], { radius: 300, color: 'red', fillColor: 'red', fillOpacity: 0.5 }).addTo(map);
          });
        }

        // Function to add green zones (Police Stations)
        function addGreenZones() {
          var greenZones = ${JSON.stringify(greenZones)};
          greenZones.forEach(zone => {
            L.circle([zone.lat, zone.lon], { radius: 300, color: 'green', fillColor: 'green', fillOpacity: 0.5 })
              .addTo(map)
              .bindPopup(zone.name);
          });
        }

        // Function to add crime rate heatmap with high visibility
        function addCrimeRateHeatmap() {
          var heatmapData = ${JSON.stringify(heatmapData)};
          var updatedHeatmapData = [];
          
          heatmapData.forEach(point => {
            let intensity = point[2];

            // Adjust intensity for areas with higher crime rates
            if (intensity > 0.7) {
              intensity = Math.min(1, intensity + 0.5); // Increase intensity for higher crime rate areas
            }
            updatedHeatmapData.push([point[0], point[1], intensity]);
          });

          L.heatLayer(updatedHeatmapData, {
            radius: 30,  // Larger radius to make the heatmap more visible
            blur: 20,    // Less blur for a sharper heatmap
            maxZoom: 17,
            minOpacity: 0.6,  // Make the heatmap more visible
            maxIntensity: 1,  // Max intensity scale
          }).addTo(map);
        }

        // Function to update the route based on destination coordinates
        function updateRoute(lat, lon) {
          if (routingControl) {
            routingControl.setWaypoints([L.latLng(${currentLocation?.latitude || 51.505}, ${currentLocation?.longitude || -0.09}), L.latLng(lat, lon)]);
          } else {
            routingControl = L.Routing.control({
              waypoints: [
                L.latLng(${currentLocation?.latitude || 51.505}, ${currentLocation?.longitude || -0.09}),
                L.latLng(lat, lon)
              ],
              routeWhileDragging: true
            }).addTo(map);
          }
        }

        // Add red zones, green zones, and crime heatmap
        addRedZones();
        addGreenZones();
        addCrimeRateHeatmap();
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={styles.input}
        placeholder="Enter destination"
        value={destination}
        onChangeText={setDestination}
        placeholderTextColor={'#888'}
      />
      <Button title="Set Destination" onPress={() => fetchCoordinates(destination)} />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled={true}
      />
      {alertVisible && (
        <CustomAlert
          title={alertTitle}
          message={alertMessage}
          onConfirm={onConfirm}
          onCancel={hideAlert}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 10,
    paddingLeft: 8,
  }
});

export default LeafletMap;
