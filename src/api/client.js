import { API_BASE_URL } from "../constants/config";

let authToken = "";

export const setAuthToken = (token) => {
  authToken = token || "";
};

const request = async (path, { method = "GET", body, headers = {} } = {}) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch {
    throw new Error(`Network request failed. Check backend and API URL: ${API_BASE_URL}`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const api = {
  // Auth
  verifyFirebasePhone: (payload) => request("/auth/verify-firebase-phone", { method: "POST", body: payload }),
  checkFirebaseStatus: () => request("/auth/firebase-status"),
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  registerAdmin: (payload) => request("/auth/admin/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me"),
  seedAdmin: () => request("/auth/admin/seed", { method: "POST" }),

  // Profile
  getProfile: () => request("/profile"),
  updateProfile: (payload) => request("/profile", { method: "PATCH", body: payload }),
  changePassword: (payload) => request("/profile/change-password", { method: "POST", body: payload }),
  completeRegistration: (payload) => request("/profile/complete-registration", { method: "POST", body: payload }),
  verifyResponder: () => request("/profile/verify-responder", { method: "POST" }),

  updateLocation: (payload) => request("/users/location", { method: "PATCH", body: payload }),
  updateStatus: (payload) => request("/users/status", { method: "POST", body: payload }),
  nearbyUsers: (radiusKm = 5) => request(`/users/nearby?radiusKm=${radiusKm}`),
  adminOverview: () => request("/users/admin/overview"),
  adminLocations: () => request("/users/admin/locations"),
  adminEmergencyUsers: () => request("/users/admin/emergency-users"),
  adminRiskUsers: () => request("/users/admin/risk-users"),

  // Emergency Contacts
  contacts: () => request("/contacts"),
  addContact: (payload) => request("/contacts", { method: "POST", body: payload }),
  updateContact: (id, payload) => request(`/contacts/${id}`, { method: "PUT", body: payload }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: "DELETE" }),

  broadcasts: () => request("/broadcasts"),
  createBroadcast: (payload) => request("/broadcasts", { method: "POST", body: payload }),

  createSos: (payload) => request("/sos", { method: "POST", body: payload }),
  activeSos: () => request("/sos/active"),
  updateSos: (id, payload) => request(`/sos/${id}`, { method: "PATCH", body: payload }),

  // India location data
  getStates: () => request("/locations/states"),
  getCities: (state) => request(`/locations/cities/${encodeURIComponent(state)}`),
  getDistricts: (state, city) => request(`/locations/districts/${encodeURIComponent(state)}/${encodeURIComponent(city)}`),

  // Help offers
  offerHelp: (payload) => request("/help/offer", { method: "POST", body: payload }),
  getPendingHelpOffers: () => request("/help/offers/pending"),
  respondToHelpOffer: (id, payload) => request(`/help/offers/${id}`, { method: "PATCH", body: payload }),
  checkHelpOffered: (userId) => request(`/help/offered/${userId}`),

  mapLayer: (type, origin, destinationType) => {
    const params = new URLSearchParams({ type });
    if (origin?.latitude && origin?.longitude) {
      params.set("originLat", String(origin.latitude));
      params.set("originLng", String(origin.longitude));
    }
    if (destinationType) params.set("destinationType", destinationType);
    return request(`/map/layers?${params.toString()}`);
  },
  systemStatus: () => request("/system/status"),
  setSystemStatus: (payload) => request("/system/status", { method: "PATCH", body: payload }),
  emergencyServices: () => request("/services/emergency-services"),

  // AI chatbot
  aiChat: (payload) => request("/ai/chat", { method: "POST", body: payload }),

  // Verified transport request
  createTransportRequest: (payload) => request("/services/transport-requests", { method: "POST", body: payload }),
  myTransportRequests: () => request("/services/transport-requests/my-history", { method: "GET" }),
  adminTransportRequests: () => request("/services/transport-requests", { method: "GET" }),
  respondTransportRequest: (id, payload) => request(`/services/transport-requests/${id}`, { method: "PATCH", body: payload })
};
