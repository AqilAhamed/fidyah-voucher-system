import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser } from '../api/api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', nric: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert('Error', 'Name, email, and password are required.');
    setLoading(true);
    try {
      const res = await registerUser(form);
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      Alert.alert('Success', 'Account created!', [{ text: 'OK', onPress: () => navigation.replace('Wallet') }]);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Account</Text>
      {['name', 'email', 'nric', 'phone'].map(key => (
        <TextInput
          key={key}
          style={styles.input}
          placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
          placeholderTextColor="#aaa"
          autoCapitalize={key === 'nric' ? 'characters' : 'none'}
          keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'}
          value={form[key]}
          onChangeText={v => update(key, v)}
        />
      ))}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={form.password}
        onChangeText={v => update('password', v)}
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flexGrow: 1, backgroundColor: '#f0f4f8', padding: 24, justifyContent: 'center' },
  title:      { fontSize: 24, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 24 },
  input:      { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, backgroundColor: '#fff', color: '#333' },
  button:     { backgroundColor: '#016a6e', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link:       { textAlign: 'center', color: '#016a6e', marginTop: 16, fontSize: 14 },
});
