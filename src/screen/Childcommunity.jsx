import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  SafeAreaView,
  View,
  Image,
  PermissionsAndroid,
  Platform
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import CustomAlert from './CustomAlert';

// Buffer polyfill for React Native
global.Buffer = global.Buffer || require('buffer').Buffer;

const SOSComponent = ({ route, navigation }) => {
  const { full_Name = 'Unknown', g_no = '000' } = route.params || {};
  const GOOGLE_API_KEY='';
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);


  const showAlert = (title, message, confirmCallback = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setOnConfirm(() => confirmCallback);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  const getCurrentLocation = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&region=in&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        throw new Error('Unable to fetch address.');
      }
    } catch (error) {
      showAlert('Error', error.message);
      return null;
    }
  };

  const sendMessage = async (endpoint) => {
    const hasPermission = await getCurrentLocation();
    if (!hasPermission) {
      showAlert('Permission Denied', 'Location permission is required.');
      return;
    }

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const fullAddress = await fetchAddress(latitude, longitude);
        if (fullAddress) {
          try {
            const response = await fetch(`http://10.25.7.160:3000/${endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                full_Name,
                g_no,
                location: fullAddress,
              }),
            });

            const responseData = await response.json();

            if (responseData.success) {
              showAlert('Success', `${endpoint.replace('-', ' ')} message sent successfully!`);
            } else {
              showAlert('Error', `Failed to send ${endpoint.replace('-', ' ')} message.`);
            }
          } catch (error) {
            showAlert('Error', 'Something went wrong.');
          }
        }
      },
      (error) => {
        showAlert('Error', error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gridContainer}>
        <Pressable style={[styles.sosButton, styles.notify]} onPress={() => sendMessage('send-notify')}>
          <Text style={styles.sosText}>Notify</Text>
          <Image source={require('../Images/bell.png')} style={styles.icon} />
        </Pressable>

        <Pressable style={[styles.sosButton, styles.assist]} onPress={() => sendMessage('send-ast')}>
          <Text style={styles.sosText}>Assistance</Text>
          <Image source={require('../Images/hand-shake.png')} style={styles.icon} />
        </Pressable>

        <Pressable style={[styles.sosButton, styles.highAlert]} onPress={() => sendMessage('send-sos')}>
          <Text style={styles.sosText}>High Alert</Text>
          <Image source={require('../Images/siren.png')} style={styles.icon} />
        </Pressable>

        <Pressable style={[styles.sosButton, styles.safeRoutes]} onPress={() => navigation.navigate('QRScan')}>
          <Text style={styles.sosText}>See SafeRoutes</Text>
          <Image source={require('../Images/safe-area.png')} style={styles.icon} />
        </Pressable>
      </View>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={hideAlert}
        onConfirm={onConfirm}
      />
    </SafeAreaView>
  );
};

export default SOSComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '90%',
    gap: 15,
  },
  sosButton: {
    width: '45%',
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  notify: {
    backgroundColor: '#44cc08',
  },
  assist: {
    backgroundColor: '#fcba03',
  },
  highAlert: {
    backgroundColor: '#FF4500',
  },
  safeRoutes: {
    backgroundColor: '#4682B4',
  },
  sosText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
});
