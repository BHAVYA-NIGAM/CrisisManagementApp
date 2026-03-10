import * as Location from "expo-location";

export const ensureLocationPermission = async () => {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === "granted") return true;
  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.status === "granted";
};

export const requestCurrentLocation = async () => {
  const granted = await ensureLocationPermission();
  if (!granted) throw new Error("Location permission is required.");
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude
  };
};
