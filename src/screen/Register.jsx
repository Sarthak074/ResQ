import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
} from 'react-native';
import CustomAlert from './CustomAlert'; // Import the CustomAlert component

const Register = ({ navigation }) => {
  const [activeInput, setActiveInput] = useState(null);
  const [name, setName] = useState('');
  const [fullName, setFullName] = useState('');
  const [guardianNo, setGuardianNo] = useState('');
  const [dob, setDob] = useState('');
  const [adhar, setAdhar] = useState('');
  const [password, setPassword] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isValidAdhar, setIsValidAdhar] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [isValidGuardianNo, setIsValidGuardianNo] = useState(true);

  // Custom Alert State
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

  const dobRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  const adharRegex = /^[2-9]\d{11}$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const guardianNoRegex = /^[6-9]\d{9}$/;

  const handleChange = (text) => {
    setDob(text);
    setIsValid(dobRegex.test(text));
  };

  const handleAdharChange = (text) => {
    setAdhar(text);
    setIsValidAdhar(adharRegex.test(text));
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setIsValidPassword(passwordRegex.test(text));
  };

  const handleGuardianNoChange = (text) => {
    setGuardianNo(text);
    setIsValidGuardianNo(guardianNoRegex.test(text));
  };

  const showAlert = (title, message, confirmCallback = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setOnConfirm(() => confirmCallback);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  const fetchData = async () => {
    try {
      if (!name || !adhar || !dob || !password || !fullName || !guardianNo) {
        showAlert('Error', 'Please provide all the details!');
        return;
      }

      // Check for duplicates
      const response = await fetch(
        `http://10.25.7.160:3000/username?username=${name}&adhar_no=${adhar}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (
        data.success &&
        data.message === 'User or Aadhaar number already exists'
      ) {
        showAlert('Error', 'Username or Aadhaar Number already exists!');
        return;
      }

      // Proceed to registration if no conflicts
      const registerResponse = await fetch('http://10.25.7.160:3000/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          Adhar: adhar,
          Dob: dob,
          Password: password,
          FullName: fullName,
          GuardianNo: guardianNo,
        }),
      });

      const registerData = await registerResponse.json();
      console.log(registerData.full_Name);
      console.log(registerData.g_no);

      if (registerData.success) {
        showAlert('Success', 'Registered Successfully!', () => {
          navigation.navigate('Option');
        });
      } else {
        showAlert('Error', registerData.message || 'Registration failed.');
      }
    } catch (error) {
      console.error('Error:', error.message);
      showAlert('Error', 'Error connecting to server. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require('../Images/ResQ.png')} />

      <TextInput
        placeholder="Username"
        placeholderTextColor="#888"
        style={[
          styles.textBox,
          activeInput === 'username' && styles.activeInputText,
        ]}
        onFocus={() => setActiveInput('username')}
        onBlur={() => setActiveInput(null)}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Full name"
        placeholderTextColor="#888"
        style={[
          styles.textBox,
          activeInput === 'fullname' && styles.activeInputText,
        ]}
        onFocus={() => setActiveInput('fullname')}
        onBlur={() => setActiveInput(null)}
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        placeholder="Guardian No."
        placeholderTextColor="#888"
        style={[
          styles.textBox,
          activeInput === 'guardian' && styles.activeInputText,
          !isValidGuardianNo && styles.errorInput,
        ]}
        onFocus={() => setActiveInput('guardian')}
        onBlur={() => setActiveInput(null)}
        inputMode="numeric"
        value={guardianNo}
        onChangeText={handleGuardianNoChange}
      />
      {!isValidGuardianNo && (
        <Text style={styles.errorText}>Enter Valid 10 Digit Mobile No.</Text>
      )}

      <TextInput
        placeholder="Adhar No."
        placeholderTextColor="#888"
        style={[
          styles.textBox,
          activeInput === 'Adhar' && styles.activeInputText,
          !isValidAdhar && styles.errorInput,
        ]}
        onFocus={() => setActiveInput('Adhar')}
        onBlur={() => setActiveInput(null)}
        inputMode="numeric"
        value={adhar}
        onChangeText={handleAdharChange}
      />
      {!isValidAdhar && (
        <Text style={styles.errorText}>Enter Valid 12 Digit Adhar No.</Text>
      )}

      <TextInput
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#888"
        style={[
          styles.textBox,
          activeInput === 'Dob' && styles.activeInputText,
          !isValid && styles.errorInput,
        ]}
        onFocus={() => setActiveInput('Dob')}
        onBlur={() => setActiveInput(null)}
        inputMode="numeric"
        value={dob}
        onChangeText={handleChange}
      />
      {!isValid && (
        <Text style={styles.errorText}>Invalid Date of Birth format.</Text>
      )}

      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        style={[
          styles.textBox,
          activeInput === 'password' && styles.activeInputText,
          !isValidPassword && styles.errorInput,
        ]}
        onFocus={() => setActiveInput('password')}
        onBlur={() => setActiveInput(null)}
        value={password}
        onChangeText={handlePasswordChange}
        secureTextEntry={true}
      />
      {!isValidPassword && (
        <Text style={styles.errorText}>
          Password must be at least 8 characters long, include uppercase and
          lowercase letters, a number, and a special character.
        </Text>
      )}

      <Pressable style={styles.button} onPress={fetchData}>
        <Text style={styles.buttonText}>Register</Text>
      </Pressable>

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
  },
  textBox: {
    width: 250,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
    marginTop: 10,
  },
  activeInputText: {
    borderColor: '#007BFF',
    borderWidth: 3,
  },
  errorInput: {
    borderColor: 'red',
    borderWidth: 2,
  },
  errorText: {
    marginTop: 5,
    color: 'red',
    width: 300,
    textAlign: 'center',
  },
  button: {
    width: 250,
    height: 50,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    marginTop: 10,
    paddingVertical: 12,
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
});

export default Register;