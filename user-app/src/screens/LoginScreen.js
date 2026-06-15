import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../api/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields.');
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.account));
      navigation.replace('Wallet');
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.logo}>🕌</Text>
        <Text style={styles.title}>Fidyah Vouchers</Text>
        <Text style={styles.subtitle}>MUIS Digital Voucher System</Text>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f0f4f8', justifyContent: 'center', padding: 24 },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  logo:         { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title:        { fontSize: 24, fontWeight: '700', color: '#1a1a2e', textAlign: 'center' },
  subtitle:     { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 28 },
  input:        { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, color: '#333' },
  button:       { backgroundColor: '#016a6e', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  buttonText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
  link:         { textAlign: 'center', color: '#016a6e', marginTop: 16, fontSize: 14 },
});
