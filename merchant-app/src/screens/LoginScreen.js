import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginMerchant } from '../api/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields.');
    setLoading(true);
    try {
      const res = await loginMerchant(email, password);
      await AsyncStorage.setItem('merchantToken', res.data.token);
      await AsyncStorage.setItem('merchant', JSON.stringify(res.data.account));
      navigation.replace('Scanner');
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏪</Text>
      <Text style={styles.title}>Merchant Portal</Text>
      <Text style={styles.subtitle}>Fidyah Voucher Acceptance App</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Merchant Email" 
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

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
        <Text style={styles.registerText}>
          Don't have an account? <Text style={styles.registerTextBold}>Apply Here</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', padding: 28 },
  logo:             { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title:            { fontSize: 26, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subtitle:         { fontSize: 13, color: '#aaa', textAlign: 'center', marginBottom: 32 },
  input:            { borderWidth: 1, borderColor: '#333', backgroundColor: '#252540', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, color: '#fff' },
  button:           { backgroundColor: '#016a6e', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  buttonText:       { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerLink:     { marginTop: 24, alignItems: 'center' },
  registerText:     { color: '#aaa', fontSize: 14 },
  registerTextBold: { color: '#016a6e', fontWeight: '700' }
});