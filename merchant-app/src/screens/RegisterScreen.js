import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { registerMerchant } from '../api/api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ business_name:'', email:'', password:'', uen:'', bank_account:'' });
  const [loading, setLoading] = useState(false);
  
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = async () => {
    if (!form.business_name || !form.email || !form.password) { 
      Alert.alert('Error', 'Business Name, Email, and Password are required.'); 
      return; 
    }
    setLoading(true);
    try {
      await registerMerchant(form);
      Alert.alert(
        'Application Submitted!', 
        'Your merchant account has been created. Please wait for MUIS to approve your account before logging in.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'Network error. Try again.');
    } finally { 
      setLoading(false); 
    }
  };

  const fields = [
    { key:'business_name', label:'Business Name', placeholder:'e.g. Fidyah Mini Mart', secure:false, keyboard:'default' },
    { key:'email',         label:'Email',         placeholder:'shop@example.com',      secure:false, keyboard:'email-address' },
    { key:'password',      label:'Password',      placeholder:'Min 8 characters',      secure:true,  keyboard:'default' },
    { key:'uen',           label:'UEN (optional)', placeholder:'123456789X',           secure:false, keyboard:'default' },
    { key:'bank_account',  label:'Bank Account (optional)', placeholder:'123-456-789', secure:false, keyboard:'default' },
  ];

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Merchant Application</Text>
      <Text style={s.sub}>Apply to accept MUIS Fidyah Vouchers</Text>
      
      {fields.map(f => (
        <View key={f.key} style={{width:'100%',marginBottom:12}}>
          <Text style={s.label}>{f.label}</Text>
          <TextInput 
            style={s.input} 
            placeholder={f.placeholder} 
            value={form[f.key]}
            onChangeText={v => upd(f.key,v)} 
            secureTextEntry={f.secure} 
            keyboardType={f.keyboard} 
            autoCapitalize="none"
          />
        </View>
      ))}

      <TouchableOpacity style={s.btn} onPress={handle} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff"/> : <Text style={s.btnText}>Submit Application</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={s.link}>Already applied? <Text style={{color:'#016a6e',fontWeight:'600'}}>Log In</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flexGrow:1,backgroundColor:'#f0f4f8',alignItems:'center',padding:24,paddingTop:60},
  title:{fontSize:24,fontWeight:'700',color:'#1a1a2e',marginBottom:4},
  sub:{fontSize:14,color:'#888',marginBottom:28,textAlign:'center'},
  label:{fontSize:13,fontWeight:'600',color:'#555',marginBottom:5},
  input:{width:'100%',backgroundColor:'#fff',borderRadius:12,padding:14,fontSize:15,borderWidth:1,borderColor:'#e5e7eb'},
  btn:{width:'100%',backgroundColor:'#016a6e',borderRadius:12,padding:16,alignItems:'center',marginTop:8},
  btnText:{color:'#fff',fontSize:16,fontWeight:'700'},
  link:{marginTop:20,fontSize:14,color:'#666'},
});