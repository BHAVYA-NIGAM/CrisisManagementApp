import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "../../components/ScreenContainer";
import { api } from "../../api/client";
import { requestCurrentLocation } from "../../utils/location";

const region = {
  latitude: 26.45,
  longitude: 80.33,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06
};

const layerOptions = [
  { key: "crime", label: "Crime Map" },
  { key: "crowd", label: "Crowd Density" },
  { key: "route", label: "Safe Route" }
];

const toneColor = (score) => {
  if (score >= 70) return "rgba(239,68,68,0.45)";
  if (score >= 40) return "rgba(245,158,11,0.42)";
  return "rgba(34,197,94,0.40)";
};

export default function MapScreen() {
  const [layer, setLayer] = useState("crime");
  const [data, setData] = useState({ points: [], routes: [] });
  const [userLocation, setUserLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [destinationType, setDestinationType] = useState("hospital");
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeCache, setRouteCache] = useState({});

  const load = async (nextLayer, origin = userLocation) => {
    try {
      if (nextLayer === "route") {
        const cacheKey = `${destinationType}_${origin?.latitude?.toFixed?.(3)}_${origin?.longitude?.toFixed?.(3)}`;
        if (routeCache[cacheKey]) {
          setData(routeCache[cacheKey]);
          return;
        }
        setRouteLoading(true);
        const res = await api.mapLayer(nextLayer, origin, destinationType);
        setData(res);
        setRouteCache((prev) => ({ ...prev, [cacheKey]: res }));
        return;
      }
      const res = await api.mapLayer(nextLayer, origin);
      setData(res);
    } catch (err) {
      Alert.alert("Map load failed", err.message);
    } finally {
      setRouteLoading(false);
    }
  };

  const refreshGpsLocation = async () => {
    setRefreshing(true);
    try {
      const loc = await requestCurrentLocation();
      setUserLocation(loc);
      await api.updateLocation(loc);
      await load(layer, loc);
    } catch (err) {
      Alert.alert("Location error", err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshGpsLocation();
  }, []);

  useEffect(() => {
    if (userLocation) load(layer, userLocation);
  }, [layer, userLocation, destinationType]);

  return (
    <ScreenContainer>
      <View style={styles.switchRow}>
        {layerOptions.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.switch, layer === item.key && styles.switchActive]}
            onPress={() => setLayer(item.key)}
          >
            <Text style={[styles.switchText, layer === item.key && styles.switchTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.locationRow}>
        <Text style={styles.locationText}>
          {userLocation
            ? `GPS: ${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}`
            : "GPS: Fetching current location..."}
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshGpsLocation}>
          <Text style={styles.refreshText}>{refreshing ? "Locating..." : "Refresh GPS"}</Text>
        </TouchableOpacity>
      </View>

      {layer === "route" ? (
        <View style={styles.destinationRow}>
          <TouchableOpacity
            style={[styles.destinationBtn, destinationType === "hospital" && styles.destinationActive]}
            onPress={() => setDestinationType("hospital")}
          >
            <Text style={[styles.destinationText, destinationType === "hospital" && styles.destinationTextActive]}>
              Hospital
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.destinationBtn, destinationType === "police" && styles.destinationActive]}
            onPress={() => setDestinationType("police")}
          >
            <Text style={[styles.destinationText, destinationType === "police" && styles.destinationTextActive]}>
              Police Station
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.mapWrap}>
        {!userLocation || routeLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2456e3" />
            <Text style={styles.loadingText}>
              {!userLocation ? "Fetching your GPS location..." : "Calculating safest road routes..."}
            </Text>
          </View>
        ) : null}
        {Platform.OS === "web" ? (
          <View style={styles.webFallback}>
            <Text style={styles.webTitle}>Web Safe Map View</Text>
            <Text style={styles.webSub}>
              Native map is shown on Android/iOS. On web, showing live layer data summary.
            </Text>
            {layer === "route" && data.destination?.name ? (
              <Text style={styles.webItemText}>Destination: {data.destination.name}</Text>
            ) : null}
            {userLocation ? (
              <Text style={styles.webItemText}>
                Current Location: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
              </Text>
            ) : null}
            {layer === "route"
              ? (data.routes || []).map((route) => (
                  <View key={route.id} style={styles.webItem}>
                    <Text style={styles.webItemTitle}>{route.id}</Text>
                    <Text style={styles.webItemText}>Risk: {route.risk}</Text>
                    <Text style={styles.webItemText}>Points: {route.coords?.length || 0}</Text>
                  </View>
                ))
              : (data.points || []).map((point) => (
                  <View key={point.id} style={styles.webItem}>
                    <Text style={styles.webItemTitle}>{point.id}</Text>
                    <Text style={styles.webItemText}>
                      Lat/Lng: {point.latitude}, {point.longitude}
                    </Text>
                    <Text style={styles.webItemText}>Score: {point.score}</Text>
                  </View>
                ))}
          </View>
        ) : (
          <NativeMap data={data} userLocation={userLocation} />
        )}
      </View>
    </ScreenContainer>
  );
}

function NativeMap({ data, userLocation }) {
  const Maps = require("react-native-maps");
  const MapView = Maps.default;
  const { Circle, Marker, Polyline } = Maps;
  const currentRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06
      }
    : region;

  return (
    <MapView style={styles.map} initialRegion={currentRegion} region={currentRegion}>
      {userLocation ? (
        <Marker coordinate={userLocation} pinColor="#2563eb" title="You are here" description="Current GPS location" />
      ) : null}

      {/* Small heat zones around markers */}
      {(data.points || []).map((point) => (
        <Circle
          key={`${point.id}-circle`}
          center={{ latitude: point.latitude, longitude: point.longitude }}
          radius={300}
          fillColor={point.score >= 70 ? "rgba(239,68,68,0.25)" : point.score >= 40 ? "rgba(245,158,11,0.25)" : "rgba(34,197,94,0.25)"}
          strokeColor={point.score >= 70 ? "rgba(239,68,68,0.5)" : point.score >= 40 ? "rgba(245,158,11,0.5)" : "rgba(34,197,94,0.5)"}
          strokeWidth={2}
        />
      ))}

      {/* Markers on top of circles */}
      {(data.points || []).map((point) => (
        <Marker
          key={point.id}
          coordinate={{ latitude: point.latitude, longitude: point.longitude }}
          pinColor={point.score >= 70 ? "#ef4444" : point.score >= 40 ? "#f59e0b" : "#22c55e"}
          title={point.label || (point.score >= 70 ? "High risk zone" : point.score >= 40 ? "Moderate risk area" : "Low risk area")}
          description={point.description || (point.level ? `${point.level} risk based on recent reports.` : undefined)}
        />
      ))}

      {(data.routes || []).map((route) => (
        <Polyline key={route.id} coordinates={route.coords} strokeColor={route.color} strokeWidth={6} />
      ))}
      {data?.destination ? (
        <Marker
          coordinate={{ latitude: data.destination.latitude, longitude: data.destination.longitude }}
          pinColor="#7c3aed"
          title={data.destination.name || "Destination"}
          description={data.destinationType === "police" ? "Police station target" : "Hospital target"}
        />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: "row", marginHorizontal: 12, marginTop: 10, marginBottom: 8 },
  switch: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#e5e7eb"
  },
  switchActive: { backgroundColor: "#bfdbfe" },
  switchText: { color: "#374151", fontWeight: "600", fontSize: 12 },
  switchTextActive: { color: "#1d4ed8" },
  destinationRow: {
    marginHorizontal: 12,
    marginBottom: 8,
    flexDirection: "row"
  },
  destinationBtn: {
    marginRight: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  destinationActive: {
    backgroundColor: "#d1fae5"
  },
  destinationText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "600"
  },
  destinationTextActive: {
    color: "#065f46"
  },
  locationRow: {
    marginHorizontal: 12,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#e0e7ff",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  locationText: { color: "#1f2937", fontSize: 12, flex: 1, marginRight: 8 },
  refreshBtn: { backgroundColor: "#2456e3", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  refreshText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  mapWrap: { flex: 1, marginHorizontal: 12, marginBottom: 12, borderRadius: 14, overflow: "hidden" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.92)",
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  loadingText: {
    marginTop: 8,
    color: "#1f2937",
    fontWeight: "600"
  },
  map: { flex: 1 },
  webFallback: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    padding: 14
  },
  webTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827"
  },
  webSub: {
    marginTop: 4,
    color: "#4b5563",
    marginBottom: 10
  },
  webItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8
  },
  webItemTitle: {
    fontWeight: "700",
    color: "#111827"
  },
  webItemText: {
    color: "#374151",
    marginTop: 2
  }
});
