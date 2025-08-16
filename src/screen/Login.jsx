import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Image, StyleSheet } from 'react-native';
import CustomAlert from './CustomAlert'; // Import the CustomAlert component

const Login = ({ navigation }) => {
  const [activeInput, setActiveInput] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
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

  const loginInfo = async () => {
    try {
      console.log('Sending data to server', { username, password });

      if (!username || !password) {
        showAlert('Error', 'Please fill all fields.');
        return;
      }

      const res = await fetch('http://10.25.7.160:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username,
          Password: password,
        }),
      });

      const result = await res.json();

      if (result.success) {
        showAlert('Login Successful', 'Welcome!', () => {
          console.log('Navigating to MyTabs with username:', result.username);
          navigation.navigate('MyTabs', {
            username: result.username,
            u_id: result.u_id,
            full_Name: result.full_Name,
            g_no: result.g_no,
          });
        });
      } else {
        showAlert('Login Failed', result.message || 'Invalid credentials.');
      }
    } catch (error) {
      console.error('Error connecting to the server:', error);
      showAlert('Error', 'Unable to connect to the server. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require('../Images/ResQ.png')} />
      <View style={{ gap: 20 }}>
        <TextInput
          placeholder="Username"
          style={[
            styles.textInput,
            activeInput === 'username' && styles.activeInputStyle,
          ]}
          placeholderTextColor="#888"
          onFocus={() => setActiveInput('username')}
          onBlur={() => setActiveInput(null)}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          placeholder="Password"
          style={[
            styles.textInput,
            activeInput === 'password' && styles.activeInputStyle,
          ]}
          placeholderTextColor="#888"
          secureTextEntry={true}
          onFocus={() => setActiveInput('password')}
          onBlur={() => setActiveInput(null)}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.button} onPress={loginInfo}>
          <Text style={styles.buttonText}>Login</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  logo: {
    width: 250,
    height: 150,
    marginBottom: 30,
  },
  textInput: {
    width: 250,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  activeInputStyle: {
    borderColor: '#007BFF',
    borderWidth: 3,
  },
});

export default Login;