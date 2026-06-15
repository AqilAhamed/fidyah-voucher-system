import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getMyVouchers } from '../api/api';

export default function WalletScreen() {
  const [vouchers, setVouchers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]   = useState(null);

  const fetchVouchers = useCallback(async () => {
    try {
      const res = await getMyVouchers();
      setVouchers(res.data.vouchers);
    } catch (err) {
      Alert.alert('Error', 'Failed to load vouchers. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const onRefresh = () => { setRefreshing(true); fetchVouchers(); };

  const activeVouchers   = vouchers.filter(v => !v.is_redeemed && !v.is_voided);
  const redeemedVouchers = vouchers.filter(v => v.is_redeemed);

  const renderVoucher = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, item.is_redeemed && styles.cardUsed]}
      onPress={() => !item.is_redeemed && setSelected(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardRow}>
        <View>
          <Text style={styles.campaignName}>{item.campaign_name}</Text>
          <Text style={styles.voucherAmount}>${parseFloat(item.amount).toFixed(2)}</Text>
          <Text style={styles.voucherMeta}>Voucher #{item.id}</Text>
        </View>
        <View style={[styles.badge, item.is_redeemed ? styles.badgeUsed : styles.badgeActive]}>
          <Text style={styles.badgeText}>{item.is_redeemed ? 'Used' : 'Active'}</Text>
        </View>
      </View>
      {!item.is_redeemed && <Text style={styles.tapHint}>Tap to show QR code</Text>}
      {item.is_redeemed && <Text style={styles.redeemedMeta}>Redeemed {new Date(item.redeemed_at).toLocaleDateString()}</Text>}
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#016a6e" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Vouchers</Text>
      <Text style={styles.subheader}>{activeVouchers.length} active • {redeemedVouchers.length} used</Text>

      <FlatList
        data={vouchers}
        keyExtractor={item => String(item.id)}
        renderItem={renderVoucher}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#016a6e" />}
        ListEmptyComponent={<Text style={styles.empty}>No vouchers yet. Check back after MUIS issues them.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      {/* QR Code Modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Show this to the merchant</Text>
            <Text style={styles.modalAmount}>${selected && parseFloat(selected.amount).toFixed(2)}</Text>
            {selected && (
              <QRCode
                value={selected.signed_payload}
                size={220}
                color="#1a1a2e"
                backgroundColor="#fff"
              />
            )}
            <Text style={styles.modalNote}>Do not screenshot. Show your phone screen directly to the merchant.</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f0f4f8', padding: 16 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:          { fontSize: 26, fontWeight: '700', color: '#1a1a2e', marginTop: 8 },
  subheader:       { fontSize: 13, color: '#888', marginBottom: 16 },
  card:            { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardUsed:        { opacity: 0.55 },
  cardRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  campaignName:    { fontSize: 12, color: '#888', marginBottom: 2 },
  voucherAmount:   { fontSize: 28, fontWeight: '700', color: '#016a6e' },
  voucherMeta:     { fontSize: 11, color: '#bbb', marginTop: 2 },
  badge:           { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeActive:     { backgroundColor: '#e6f4f1' },
  badgeUsed:       { backgroundColor: '#eee' },
  badgeText:       { fontSize: 12, fontWeight: '600', color: '#016a6e' },
  tapHint:         { fontSize: 12, color: '#016a6e', marginTop: 10 },
  redeemedMeta:    { fontSize: 11, color: '#aaa', marginTop: 8 },
  empty:           { textAlign: 'center', color: '#aaa', marginTop: 60, lineHeight: 24 },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 32, alignItems: 'center' },
  modalTitle:      { fontSize: 16, color: '#888', marginBottom: 4 },
  modalAmount:     { fontSize: 36, fontWeight: '700', color: '#016a6e', marginBottom: 24 },
  modalNote:       { fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 20, maxWidth: 260 },
  closeButton:     { marginTop: 20, backgroundColor: '#016a6e', borderRadius: 10, paddingHorizontal: 40, paddingVertical: 14 },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
