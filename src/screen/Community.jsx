import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Image,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Geolocation from 'react-native-geolocation-service';
import {PermissionsAndroid} from 'react-native';
import CustomAlert from './CustomAlert';

const Community = ({route, navigation}) => {
  const [activeInput, setActiveInput] = useState(null);
  const [message, setMessage] = useState('');
  const [locationName, setLocationName] = useState('Fetching location...');
  const [userCount, setUserCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [fullAddress, setFullAddress] = useState('');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);

  const {username, u_id} = route.params;
  const socket = useRef(null);

  const GOOGLE_API_KEY='';

  const badWords = ['fuck', 'sex', 'shit', 'bitch', 'ass'];

  const containsBadWords = message => {
    return badWords.some(word => message.toLowerCase().includes(word));
  };

  const showAlert = (title, message, confirmCallback = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setOnConfirm(() => confirmCallback);
    setAlertVisible(true);
  };

  // Hide custom alert
  const hideAlert = () => {
    setAlertVisible(false);
  };

  const fetchLocation = async () => {
    const hasPermission = await getCurrentLocation();
    if (hasPermission) {
      Geolocation.getCurrentPosition(
        async position => {
          const {latitude, longitude} = position.coords;
          const address = await fetchAddress(latitude, longitude);
          if (address) {
            setLocationName(address);
          } else {
            setLocationName('Unable to fetch location.');
          }
          storeLocationInDB(latitude, longitude, address);
        },
        error => {
          showAlert('Error', 'Unable to get location. Please try again.');
          setLocationName('Location unavailable.');
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    } else {
      showAlert('Permission Denied', 'Location permission is required.');
      setLocationName('Permission denied.');
    }
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
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&region=in&key=${GOOGLE_API_KEY}`,
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const components = data.results[0].address_components;
        const fAdd = data.results[0].formatted_address;
        setFullAddress(fAdd);
        const sublocality = components.find(comp =>
          comp.types.includes('sublocality_level_1'),
        );
        return sublocality ? sublocality.long_name : 'Unknown location';
      } else {
        throw new Error('Unable to fetch address.');
      }
    } catch (error) {
      showAlert('Error', error.message);
      return null;
    }
  };

  const storeLocationInDB = async (lat, lng, sublocality) => {
    try {
      const response = await fetch('http://10.25.7.160:3000/store-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: u_id,
          user_name: username,
          lat: lat,
          lng: lng,
          sublocality: sublocality,
        }),
      });

      if (response.ok) {
        console.log('Location stored successfully');
      } else {
        console.log('Failed to store location');
      }
    } catch (error) {
      console.error('Error storing location:', error);
    }
  };

  useEffect(() => {
    fetchLocation();

    // Establish WebSocket connection
    socket.current = new WebSocket('ws://10.25.7.160:4000');

    socket.current.onopen = () => {
      console.log('WebSocket connection established');
      if (locationName !== 'Fetching location...') {
        socket.current.send(
          JSON.stringify({
            type: 'locationUpdate',
            location: locationName,
          }),
        );
      }
    };

    socket.current.onmessage = event => {
      console.log('Message from server:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'userCount') {
          setUserCount(data.count);
        }
        if (data.type === 'receiveMessage') {
          setMessages(prevMessages => [
            ...prevMessages,
            {
              username: data.username,
              message: data.message,
              sender: data.username === username,
            },
          ]);
        }
        if (data.type === 'SOS') {
          // Handle SOS messages
          setMessages(prevMessages => [
            ...prevMessages,
            {
              username: `🔴 SOS - ${data.username}`,
              message: data.message,
              sender: false, // Treat as a received message
              lat: data.lat,
              lng: data.lng,
            },
          ]);

          showAlert('SOS Alert', `${data.username}: ${data.message}`);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.current.onerror = error => {
      console.error('WebSocket Error:', error.message);
    };

    socket.current.onclose = e => {
      console.log('WebSocket connection closed', e.reason);
    };

    return () => {
      socket.current.close(); // Cleanup socket on unmount
    };
  }, [locationName, username, fullAddress]);

  const sendMessage = () => {
    if (
      message.trim() &&
      socket.current &&
      socket.current.readyState === WebSocket.OPEN
    ) {
      if (containsBadWords(message)) {
        showAlert('Error', 'Your message contains inappropriate words.');
        return;
      }

      socket.current.send(
        JSON.stringify({
          type: 'sendMessage',
          username: username,
          message: message,
          location: locationName, // Send location with message
        }),
      );
      setMessage('');
    } else {
      showAlert('Error', 'Message cannot be empty!');
    }
  };

  const sendSOS = () => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          socket.current.send(
            JSON.stringify({
              type: 'SOS',
              username: username,
              fullAddress: fullAddress,
              message: `${username} needs help, in ${fullAddress}`,
              lat: latitude,
              lng: longitude,
            }),
          );
          showAlert(
            'SOS Sent',
            'Your SOS message has been sent to the community.',
          );
        },
        error => {
          showAlert('Error', 'Unable to get your current location.');
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    } else {
      showAlert('Error', 'Unable to send SOS. Please try again.');
    }
  };

  const renderMessage = ({item}) => (
    <View
      style={[
        styles.messageBox,
        item.sender ? styles.senderMessage : styles.receiverMessage,
      ]}>
      <Text style={{fontSize: 16, fontWeight: 'bold', color: '#343A40'}}>
        {item.username}
      </Text>
      <Text style={styles.messageText}>{item.message}</Text>

      {item.username.includes('SOS') ? (
        <Pressable
          style={styles.viewMap}
          onPress={() => {
            if (item.username.includes('SOS')) {
              navigation.navigate('MapScreen', {
                lat: item.lat,
                lng: item.lng,
                username: item.username,
              });
            }
          }}>
          <Text
            style={{textAlign: 'center', color: 'white', fontWeight: 'bold'}}>
            View on Map
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.title}>
        <Text style={styles.titleText}>{locationName}</Text>
        <View style={{flexDirection: 'row', gap: 10}}>
          <Image
            source={require('../Images/user.png')}
            style={{width: 20, height: 20}}
          />
          <Text>{userCount > 0 ? userCount : 'No users'}</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.sosContainer}>
        <Pressable style={styles.sosButton} onPress={sendSOS}>
          <Text style={styles.sosButtonText}>SOS</Text>
        </Pressable>
      </View>

      <View style={styles.inpBox}>
        <TextInput
          placeholder="Send Message!"
          style={[
            styles.textInput,
            activeInput === 'message' && styles.activeInputStyle,
          ]}
          placeholderTextColor="#888"
          onFocus={() => setActiveInput('message')}
          onBlur={() => setActiveInput(null)}
          value={message}
          onChangeText={setMessage}
        />
        <Pressable style={styles.sendBut} onPress={sendMessage}>
          <Image
            source={require('../Images/send.png')}
            style={{width: 20, height: 20}}
          />
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

export default Community;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  inpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    position: 'absolute',
    bottom: 1,
  },
  textInput: {
    width: '70%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginLeft: 15,
  },
  activeInputStyle: {
    borderColor: '#007BFF',
    borderWidth: 3,
  },
  sendBut: {
    backgroundColor: '#007BFF',
    width: '20%',
    height: 50,
    marginRight: 10,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  messageList: {
    paddingBottom: 70,
  },
  messageBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '75%',
  },
  senderMessage: {
    backgroundColor: '#80ccff',
    alignSelf: 'flex-end',
    marginRight: 20,
  },
  receiverMessage: {
    backgroundColor: '#E5E5E5',
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  messageText: {
    color: 'black',
    fontSize: 15,
  },
  sosContainer: {
    position: 'absolute',
    top: 60,
    right: 10,
    zIndex: 10,
  },
  sosButton: {
    backgroundColor: '#FF0000',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    
  },
  sosButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewMap: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    width: 100,
    padding: 5,
    marginTop: 10,
  },
});
