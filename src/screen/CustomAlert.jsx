import React from 'react';
import {View, Text, Pressable, Modal, StyleSheet, Image} from 'react-native';

const CustomAlert = ({visible, title, message, onClose, onConfirm}) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <Image source={require('../Images/ResQ.png')} style={{width:70,height:25}}/>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.closeButton]}
              onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
            {onConfirm && (
              <Pressable
                style={[styles.button, styles.confirmButton]}
                onPress={() => {
                  onConfirm(); // Execute the onConfirm callback
                  onClose(); // Close the alert
                }}>
                <Text style={styles.buttonText}>OK</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  closeButton: {
    backgroundColor: '#ccc',
  },
  confirmButton: {
    backgroundColor: '#007BFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomAlert;
