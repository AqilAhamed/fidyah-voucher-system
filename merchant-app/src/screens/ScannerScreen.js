import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Vibration
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { redeemVoucher } from '../api/api';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning]         = useState(true);
  const [result, setResult]             = useState(null); // null | 'success' | 'error'
  const [message, setMessage]           = useState('');
  const [amount, setAmount]             = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const showResult = (type, msg, amt = '') => {
    setResult(type);
    setMessage(msg);
    setAmount(amt);
    Vibration.vibrate(type === 'success' ? [0, 100, 100, 100] : 400);
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    // Auto-reset after 3 seconds
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setScanning(true);
        setResult(null);
      });
    }, 3000);
  };

  const handleScan = async ({ data }) => {
    if (!scanning || !data) return;
    setScanning(false); // Prevent duplicate scans

    try {
      const res = await redeemVoucher(data);
      showResult('success', res.data.message, `$${parseFloat(res.data.amount).toFixed(2)}`);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Scan failed. Please try again.';
      showResult('error', errMsg);
    }
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera access is required to scan vouchers.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanning ? handleScan : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay with scan frame */}
      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>Scan Fidyah Voucher</Text>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.overlayHint}>Point camera at customer's QR code or physical voucher</Text>
      </View>

      {/* Result overlay */}
      {result && (
        <Animated.View style={[styles.resultOverlay, { opacity: fadeAnim }, result === 'success' ? styles.success : styles.error]}>
          <Text style={styles.resultIcon}>{result === 'success' ? '✓' : '✗'}</Text>
          {result === 'success' && <Text style={styles.resultAmount}>{amount}</Text>}
          <Text style={styles.resultMessage}>{message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const CORNER = 24;
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#000' },
  overlay:         { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24 },
  overlayTitle:    { color: '#fff', fontSize: 20, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  scanFrame:       { width: 260, height: 260, position: 'relative' },
  corner:          { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#016a6e', borderWidth: 3 },
  topLeft:         { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight:        { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft:      { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight:     { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  overlayHint:     { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center' },
  resultOverlay:   { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  success:         { backgroundColor: 'rgba(1, 106, 110, 0.93)' },
  error:           { backgroundColor: 'rgba(180, 30, 30, 0.93)' },
  resultIcon:      { fontSize: 72, color: '#fff', fontWeight: '700' },
  resultAmount:    { fontSize: 48, color: '#fff', fontWeight: '700', marginTop: 4 },
  resultMessage:   { fontSize: 16, color: '#fff', marginTop: 12, textAlign: 'center', paddingHorizontal: 32 },
  permissionText:  { color: '#fff', textAlign: 'center', marginBottom: 24, fontSize: 15 },
  button:          { backgroundColor: '#016a6e', borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText:      { color: '#fff', fontSize: 15, fontWeight: '600' },
});
