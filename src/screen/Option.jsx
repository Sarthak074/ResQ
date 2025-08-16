import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View, ImageBackground } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


const Option = ({ navigation }) => {
  // Create animated values
  const fadeAnim = useRef(new Animated.Value(0)).current; // For opacity
  const translateYAnim = useRef(new Animated.Value(30)).current; // For movement

  // Start animation when the component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true, // Optimizes animation performance
      }),
      Animated.timing(translateYAnim, {
        toValue: 0, // Move to original position
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated Logo */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
        <Image source={require('../Images/Logo.jpeg')} style={styles.Logo} />
      </Animated.View>

      {/* Tagline */}
      <Text style={styles.tagline}>Stay Connected, Stay Protected</Text>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {/* Register Button */}
        <Pressable style={styles.button} onPress={() => navigation.navigate('Register')}>
          <View style={styles.buttonBackground}>
            <View style={styles.buttonContent}>
              <MaterialIcons name="person-add" size={24} color="white" />
              <Text style={styles.buttonText}>Register</Text>
            </View>
          </View>
        </Pressable>

        {/* Login Button */}
        <Pressable style={styles.button} onPress={() => navigation.navigate('Login')}>
          <View style={styles.buttonBackground}>
            <View style={styles.buttonContent}>
              <MaterialIcons name="login" size={24} color="white" />
              <Text style={styles.buttonText}>Login</Text>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default Option;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  Logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  tagline: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#E39751',
    marginBottom: 50,
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 20,
    width: '80%',
  },
  button: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 9,
  },
  buttonBackground: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007BFF', // Solid color for the button background
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    fontWeight: 'bold',
  },
});