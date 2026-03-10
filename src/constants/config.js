import Constants from "expo-constants";

const hostUri =
  Constants?.expoConfig?.hostUri ||
  Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
  Constants?.manifest?.debuggerHost ||
  "";

const guessedHost = hostUri.split(":")?.[0];

const normalizeApiBase = (raw) => {
  if (!raw) return raw;
  let next = String(raw).trim();
  if (next.endsWith("/apiz")) next = `${next.slice(0, -5)}/api`;
  while (next.endsWith("/")) next = next.slice(0, -1);
  if (!next.endsWith("/api")) next = `${next}/api`;
  return next;
};

// Set EXPO_PUBLIC_API_BASE_URL for physical devices.
export const API_BASE_URL =
  normalizeApiBase(process.env.EXPO_PUBLIC_API_BASE_URL) ||
  (guessedHost ? `http://${guessedHost}:4000/api` : "http://localhost:4000/api");

export const SOCKET_URL = API_BASE_URL.replace(/\/api$/, "");

export const QUICK_ALERT_TEMPLATES = [
  {
    key: "EARTHQUAKE",
    label: "Earthquake",
    severity: "emergency",
    title: "Earthquake Alert",
    message: "Strong tremors reported. Move to open areas and avoid damaged structures.",
    alertType: "Emergency"
  },
  {
    key: "FLOOD",
    label: "Flood",
    severity: "danger",
    title: "Flood Warning",
    message: "Heavy flooding in low-lying areas. Move to higher ground immediately.",
    alertType: "Danger"
  },
  {
    key: "WAR_ATTACK",
    label: "War Attack",
    severity: "emergency",
    title: "War Attack Warning",
    message: "Seek nearest shelter immediately and follow official instructions.",
    alertType: "Emergency"
  },
  {
    key: "TERROR_THREAT",
    label: "Terror Threat",
    severity: "danger",
    title: "Terror Threat Advisory",
    message: "Avoid crowded public places and report suspicious activity to authorities.",
    alertType: "Danger"
  },
  {
    key: "FIRE",
    label: "Fire",
    severity: "danger",
    title: "Fire Emergency",
    message: "Fire outbreak detected. Evacuate calmly and avoid smoke-heavy routes.",
    alertType: "Danger"
  },
  {
    key: "PANDEMIC",
    label: "Pandemic",
    severity: "warning",
    title: "Public Health Advisory",
    message: "Follow masking and distancing guidelines. Avoid unnecessary travel.",
    alertType: "Advisory"
  },
  {
    key: "CURFEW",
    label: "Curfew",
    severity: "warning",
    title: "Curfew Alert",
    message: "Curfew in effect. Stay indoors until further official notice.",
    alertType: "Warning"
  },
  {
    key: "EVACUATION",
    label: "Evacuation Order",
    severity: "emergency",
    title: "Evacuation Order",
    message: "Immediate evacuation required. Move to designated safe zones now.",
    alertType: "Emergency"
  }
];
