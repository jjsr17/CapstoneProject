import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Button, StyleSheet, Alert, Pressable, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import SegmentedControl from '@react-native-segmented-control/segmented-control';



export default function SignUpScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    birthDate: '',
    address: '',
    state: '',
    country: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState([]);
    
    const [birthMonth, setBirthMonth] = useState('');
    const [birthDay, setBirthDay] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');


    const requiredFields = [
        'firstName',
        'lastName',
        'birthDate',
        'email',
        'password',
        'confirmPassword',
    ];

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const validateForm = () => {
    for (const field of requiredFields) {
        if (!form[field] || form[field].toString().trim() === '') {
            return false;
        }
    }
    return true;
  };

const handleSignUp = () => {
  if (!validateForm()) {
    setError('Please fill out all required fields.');
    return;
  }

  if (form.password !== form.confirmPassword) {
    setError('Passwords do not match.');
    return;
  }

  setError('');
  Alert.alert('Success', 'Account created (UI only)');
  navigation.goBack();
};


  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = Array.from({ length: 31}, (_, i) => i + 1);
  const years = Array.from({ length:100 }, (_, i) => new Date().getFullYear() -i);
  const birthOptions = months.map((month, i) => `${month} ${days[i % 31] || 1}, ${years[i % 100] || new Date().getFullYear()}`);

  const [birthDate, setBirthDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  //Lines 65-75, Segmented control | Student / Teacher
  // Lines 81-134, Birth Date UI Dropdowns 
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sign Up</Text>


      <Text style={styles.label}>Account Type</Text>

      <SegmentedControl
        values={['Student', 'Tutor']}
        selectedIndex={role === 'student' ? 0 : 1}
        onChange={(event) => {
            const index = event.nativeEvent.selectedSegmentIndex;
            const value = index === 0 ? 'student' : 'tutor';
            setRole(value);
            handleChange('role', value);
        }}
        style={{marginBottom: 20}}
        />

      <TextInput style={styles.input} placeholder="First Name (required)" onChangeText={v => handleChange('firstName', v)} />
      <TextInput style={styles.input} placeholder="Middle Name (required)" onChangeText={v => handleChange('middleName', v)} />
      <TextInput style={styles.input} placeholder="Last Name (required)" onChangeText={v => handleChange('lastName', v)} />

<Text style={styles.label}>Birth Date</Text>

<Pressable
  style={styles.input}
  onPress={() => setShowPicker(true)}
>
  <Text style={{ color: birthDate ? '#000' : '#999' }}>
    {birthDate
      ? birthDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Select birth date (required)'}
  </Text>
</Pressable>

<Modal
  transparent
  animationType="slide"
  visible={showPicker}
  onRequestClose={() => setShowPicker(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.pickerContainer}>
      <View style={styles.pickerHeader}>
        <Pressable onPress={() => setShowPicker(false)}>
         
        </Pressable>

        <Pressable
          onPress={() => {
            setBirthDate(tempDate);
            handleChange('birthDate', tempDate);
            setShowPicker(false);
          }}
        >
          <Text style={styles.confirmText}>Confirm</Text>
        </Pressable>
      </View>

      <DateTimePicker
        value={tempDate}
        mode="date"
        display="spinner"     //  iOS wheel picker
        maximumDate={new Date()} // no future birthdays
        textColor= "black"
        onChange={(event, selectedDate) => {
          if (selectedDate) setTempDate(selectedDate);
        }}
      />
    </View>
  </View>
</Modal>

      <TextInput style={styles.input} placeholder="Address (required)" onChangeText={v => handleChange('address', v)} />
      <TextInput style={styles.input} placeholder="State (required)" onChangeText={v => handleChange('state', v)} />
      <TextInput style={styles.input} placeholder="Country (required)" onChangeText={v => handleChange('country', v)} />
      <TextInput style={styles.input} placeholder="Email Address (required)" autoCapitalize="none" onChangeText={v => handleChange('email', v)} />
      <TextInput style={styles.input} placeholder="Password (required)" secureTextEntry onChangeText={v => handleChange('password', v)} />
      <TextInput style={styles.input} placeholder="Confirm Password (required)" secureTextEntry onChangeText={v => handleChange('confirmPassword', v)} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button title="Create Account" onPress={handleSignUp} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maginBottom: 20,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  label: {
    marginBottom: 6,
    fontSize: 16,
    fontWeight: '500',
  },
  birthRow:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    maginBottom: 20,
    zIndex: 10,
  },
  birthPicker: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginHorizontal: 4,
    height: 50,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  confirmText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
});
