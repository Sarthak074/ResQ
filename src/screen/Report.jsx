import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from './CustomAlert'; // Import the CustomAlert component

const Report = ({ route,navigation }) => {
  const [activeInput, setActiveInput] = useState(null);
  const [report, setReport] = useState('');
  const [reportType, setReportType] = useState('');
  const [reports, setReports] = useState([]);
  const [isFetched, setIsFetched] = useState(false);
  const [inputButton, setInputButton] = useState('Report');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);

  const { username, u_id } = route.params;

  const [slideAnim] = useState(new Animated.Value(0));

  // Toggle add report
  const toggleReport = () => {
    if (showReport) {
      // Slide up (hide)
      Animated.timing(slideAnim, {
        toValue: 0, // Height goes back to 0
        duration: 300,
        easing: Easing.circle,
        useNativeDriver: false,
      }).start(() => setShowReport(false));
    } else {
      // Slide down (show)
      setShowReport(true);
      Animated.timing(slideAnim, {
        toValue: 300, // Adjust the value based on your design
        duration: 300,
        easing: Easing.circle,
        useNativeDriver: false,
      }).start();
    }
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

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `http://10.25.7.160:3000/reports?username=${username}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        if (data.reports.length === 0) {
          console.log('No reports available for this user.');
          setReports([]);
        } else {
          setReports(data.reports);
        }
      }

      setIsFetched(true);
    } catch (error) {
      console.error('Error connecting to the server:', error);
      showAlert('Error', 'Unable to connect to the server. Please try again later.');
    }
  };

  useEffect(() => {
    if (!isFetched) {
      fetchReports();
    }
  }, [isFetched]);

  const sendReport = async () => {
    try {
      if (!report || !reportType) {
        showAlert('Error', 'Please fill all the fields!');
        return;
      }
      const res = await fetch('http://10.25.7.160:3000/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: username,
          u_id: u_id,
          report: report,
          report_type: reportType,
        }),
      });
      const result = await res.json();
      console.log(result.r_id);
      if (result.success) {
        showAlert('Success', 'Report submitted successfully!', () => {
          const newReport = {
            r_id: result.r_id,
            status: result.status,
            report: report,
            user_name: username,
            u_id: u_id,
            report_type: reportType,
          };

          setReports(prevReports => [newReport, ...prevReports]);
          setReport('');
          setReportType('');
        });
      } else {
        showAlert('Error', result.message || 'Report submission failed.');
      }
    } catch (error) {
      console.error('Error connecting to the server:', error);
      showAlert('Error', 'Unable to connect to the server. Please try again later.');
    }
  };

  const deletePosts = async (r_id) => {
    if (!r_id) {
      showAlert('Error', 'Invalid Report ID');
      return;
    }

    try {
      const response = await fetch(
        `http://10.25.7.160:3000/delReport?r_id=${r_id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        console.error(`Failed with status ${response.status}:`, result);
        throw new Error(result.message || 'Failed to delete the report');
      }

      if (result.success) {
        showAlert('Success', 'Report deleted successfully!', () => {
          setReports(prevReports =>
            (prevReports || []).filter(report => report.r_id !== r_id),
          );
        });
      } else {
        showAlert('Error', result.message || 'Failed to delete the report.');
      }
    } catch (error) {
      console.error('Error connecting to the server:', error);
      showAlert('Error', 'Unable to delete the report. Please check your connection and try again.');
    }
  };

  const updatePosts = async ({ r_id, report }) => {
    if (!r_id || !report) {
      showAlert('Error', 'Invalid Report ID or Report content');
      return;
    }
    try {
      const response = await fetch(
        `http://10.25.7.160:3000/updateReport?r_id=${r_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ report }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        console.error(`Failed with status ${response.status}:`, result);
        throw new Error(result.message || 'Failed to update the report');
      }

      if (result.success) {
        showAlert('Success', 'Report updated successfully!', () => {
          setReports(prevReports =>
            prevReports.map(reportItem =>
              reportItem.r_id === r_id
                ? { ...reportItem, report: result.report }
                : reportItem,
            ),
          );
          setInputButton('Report');
          setReport('');
          setSelectedReportId(null);
        });
      } else {
        showAlert('Error', result.message || 'Failed to update the report.');
      }
    } catch (error) {
      console.error('Error connecting to the server:', error);
      showAlert('Error', 'Unable to update the report. Please check your connection and try again.');
    }
  };

  const udt = (report, id) => {
    setReport(report);
    setSelectedReportId(id);
    setInputButton('Update');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.post, { height: slideAnim }]}>
        {showReport && (
          <>
            <Text style={styles.sYT}>Report Incident!</Text>
            <TextInput
              placeholder="Enter Report Type"
              placeholderTextColor="#888"
              value={reportType}
              onChangeText={setReportType}
              style={[
                styles.textinpRT,
                activeInput === 'reportType' && styles.activeInputStyle,
              ]}
              onFocus={() => setActiveInput('reportType')}
              onBlur={() => setActiveInput(null)}
            />
            <TextInput
              multiline={true}
              placeholder="Enter Report Here"
              placeholderTextColor="#888"
              value={report}
              onChangeText={setReport}
              style={[
                styles.textinp,
                activeInput === 'report' && styles.activeInputStyle,
              ]}
              onFocus={() => setActiveInput('report')}
              onBlur={() => setActiveInput(null)}
            />

            <View style={styles.rpt}>
              <View style={{ marginRight: 20 }}>
                <Text style={{ fontWeight: 'bold', color: '#36c941' }}>
                  Approved
                </Text>
                <Text style={{ fontWeight: 'bold', color: '#e85a5a' }}>
                  Declined
                </Text>
                <Text style={{ fontWeight: 'bold', color: '#b3b020' }}>
                  Waiting
                </Text>
              </View>

              <Pressable
                style={styles.button}
                onPress={() => {
                  if (inputButton === 'Report') {
                    sendReport();
                  } else if (inputButton === 'Update') {
                    if (selectedReportId && report) {
                      updatePosts({ r_id: selectedReportId, report: report });
                    } else {
                      showAlert('Error', 'Please select a valid report to update');
                    }
                  }
                }}>
                <Text style={styles.buttonText}>{inputButton}</Text>
              </Pressable>
            </View>
          </>
        )}
      </Animated.View>

      <View style={styles.postReport}>
        <Pressable onPress={toggleReport}>
          <Image
            style={{ width: 55, height: 55 }}
            source={require('../Images/sign.png')}
          />
        </Pressable>
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          const getStatusColor = (status) => {
            switch (status) {
              case 'waiting':
                return '#e6e349';
              case 'declined':
                return '#f77d77';
              case 'approved':
                return '#80f069';
              default:
                return 'gray';
            }
          };

          return (
            <View
              style={[
                styles.rpts,
                { backgroundColor: getStatusColor(item.status) },
              ]}>
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 16,
                  color: '#007BFF',
                  fontWeight: 'bold',
                  width: '50%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                {item.report_type}
              </Text>
              <Pressable
                style={styles.crud}
                onPress={() => udt(item.report, item.r_id)}>
                <Text style={styles.crudText}>Update</Text>
              </Pressable>
              <Pressable
                style={styles.crud}
                onPress={() => deletePosts(item.r_id)}>
                <Text style={styles.crudText}>Delete</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <Text
            style={{
              marginTop: 20,
              fontSize: 20,
              color: '#343A40',
              textAlign: 'center',
            }}>
            No Reports by this User!!
          </Text>
        )}
      />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  post: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  sYT: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  activeInputStyle: {
    borderColor: '#007BFF',
    borderWidth: 3,
  },
  button: {
    backgroundColor: '#007BFF',
    width: 90,
    height: 50,
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginRight: '17%',
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  textinp: {
    width: '80%',
    borderWidth: 1,
    margin: 10,
    height: 100,
    textAlign: 'center',
    borderRadius: 8,
    borderColor: '#ccc',
  },
  textinpRT: {
    width: '80%',
    borderWidth: 1,
    margin: 10,
    height: 50,
    textAlign: 'center',
    borderRadius: 8,
    borderColor: '#ccc',
  },
  rpt: {
    flexDirection: 'row',
  },
  rpts: {
    width: '85%',
    fontSize: 20,
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'center',
    alignItems: 'center',
    height: 80,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    paddingRight: 10,
    paddingLeft: 10,
    overflow: 'hidden',
  },
  crud: {
    borderWidth: 2,
    paddingHorizontal: 5,
    textAlign: 'center',
    borderRadius: 50,
    borderColor: '#6F42C1',
  },
  crudText: {
    fontWeight: 'bold',
    color: '#6F42C1',
  },
  postReport: {
    position: 'absolute',
    top: '75%',
    left: '58%',
    zIndex: 3,
    alignItems: 'center',
    width: '60%',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'center',
  },
});

export default Report;