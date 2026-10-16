import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator
} from 'react-native';
import { ArrowUpDown, Search, Train, ChevronRight, Star } from 'lucide-react-native';
import { searchTarif, formatRupiah } from '../services/TarsusDataEngine';

export default function SearchScreen() {
  const [origin, setOrigin] = useState('GAMBIR');
  const [destination, setDestination] = useState('BANDUNG');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      const data = searchTarif(origin, destination);
      setResults(data);
      setLoading(false);
    }, 200);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cari Tarif Khusus</Text>
        <Text style={styles.headerSubtitle}>Temukan tarif reduksi relasi kereta api</Text>
      </View>

      {/* Input Box */}
      <View style={styles.searchBox}>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Asal</Text>
          <TextInput
            style={styles.input}
            value={origin}
            onChangeText={setOrigin}
            placeholder="Stasiun Asal (cth. GAMBIR)"
            placeholderTextColor="#64748b"
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
          <ArrowUpDown color="#38bdf8" size={20} />
        </TouchableOpacity>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Tujuan</Text>
          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder="Stasiun Tujuan (cth. BANDUNG)"
            placeholderTextColor="#64748b"
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Search color="#fff" size={18} />
          <Text style={styles.searchBtnText}>Cari Relasi</Text>
        </TouchableOpacity>
      </View>

      {/* Result List */}
      {loading ? (
        <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.idKA + item.namaKA}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                  <Train color="#38bdf8" size={16} />
                  <Text style={styles.kaName}>{item.namaKA}</Text>
                </View>
                <Text style={styles.lowestBadge}>
                  Mulai {formatRupiah(item.main.lowestFare)}
                </Text>
              </View>

              {/* Fares */}
              <View style={styles.fareRow}>
                {item.main.eks && (
                  <View style={styles.farePill}>
                    <Text style={styles.fareClass}>Eksekutif</Text>
                    <Text style={styles.fareVal}>{formatRupiah(item.main.eks)}</Text>
                  </View>
                )}
                {item.main.bis && (
                  <View style={styles.farePill}>
                    <Text style={styles.fareClass}>Bisnis</Text>
                    <Text style={styles.fareVal}>{formatRupiah(item.main.bis)}</Text>
                  </View>
                )}
                {item.main.eko && (
                  <View style={styles.farePill}>
                    <Text style={styles.fareClass}>Ekonomi</Text>
                    <Text style={styles.fareVal}>{formatRupiah(item.main.eko)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1320' },
  header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, backgroundColor: '#0f172a' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerSubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  searchBox: { margin: 16, padding: 16, backgroundColor: '#1e293b', borderRadius: 16 },
  inputRow: { marginBottom: 12 },
  inputLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 10, fontSize: 15 },
  swapButton: { alignSelf: 'center', marginVertical: -4, padding: 6, zIndex: 10 },
  searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0284c7', padding: 14, borderRadius: 12, marginTop: 8 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kaName: { color: '#f8fafc', fontWeight: '700', fontSize: 16 },
  lowestBadge: { color: '#38bdf8', fontWeight: '700', fontSize: 14 },
  fareRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  farePill: { flex: 1, backgroundColor: '#0f172a', padding: 8, borderRadius: 8, alignItems: 'center' },
  fareClass: { color: '#94a3b8', fontSize: 11 },
  fareVal: { color: '#38bdf8', fontWeight: '700', fontSize: 13, marginTop: 2 }
});
