import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/ScreenContainer";
import { api } from "../../api/client";

const fallbackRegion = {
  latitude: 26.45,
  longitude: 80.33,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15
};

export default function AdminUsersMapScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.adminLocations();
      setUsers(res.users || []);
    } catch (err) {
      Alert.alert("Map sync failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const region = users[0]
    ? {
        latitude: users[0].latitude,
        longitude: users[0].longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15
      }
    : fallbackRegion;

  return (
    <ScreenContainer>
      <View style={styles.wrap}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#2456e3" />
            <Text style={styles.loaderText}>Loading live locations…</Text>
          </View>
        ) : Platform.OS === "web" ? (
          <View style={styles.webCard}>
            <Text style={styles.title}>Live User Locations</Text>
            {users.map((u) => (
              <View key={u.id} style={styles.item}>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.meta}>{u.status}</Text>
                <Text style={styles.meta}>{u.latitude.toFixed(5)}, {u.longitude.toFixed(5)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <NativeMap users={users} region={region} />
        )}
      </View>
    </ScreenContainer>
  );
}

function NativeMap({ users, region }) {
  const Maps = require("react-native-maps");
  const MapView = Maps.default;
  const { Marker } = Maps;

  return (
    <MapView style={{ flex: 1 }} initialRegion={region}>
      {users.map((u) => (
        <Marker
          key={u.id}
          coordinate={{ latitude: u.latitude, longitude: u.longitude }}
          title={u.name}
          description={u.status}
          pinColor={u.status === "EMERGENCY" ? "#ef4444" : u.status === "POSSIBLE_RISK" ? "#f59e0b" : "#16a34a"}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, margin: 12, borderRadius: 14, overflow: "hidden", backgroundColor: "#fff" },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  loaderText: {
    color: "#4b5563",
    fontSize: 13
  },
  webCard: { padding: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  item: { padding: 10, borderRadius: 8, backgroundColor: "#f3f4f6", marginBottom: 8 },
  name: { fontWeight: "700", color: "#111827" },
  meta: { color: "#6b7280", fontSize: 12, marginTop: 2 }
});
