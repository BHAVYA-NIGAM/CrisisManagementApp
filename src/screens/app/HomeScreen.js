import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "../../components/ScreenContainer";
import SectionCard from "../../components/SectionCard";
import BroadcastBanner from "../../components/BroadcastBanner";
import StatusModal from "../../components/StatusModal";
import HelpOfferModal from "../../components/HelpOfferModal";
import HelpOfferInputModal from "../../components/HelpOfferInputModal";
import ProfileHeader from "../../components/ProfileHeader";
import ProfileCompletionIndicator from "../../components/ProfileCompletionIndicator";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useSocketEvents } from "../../context/SocketContext";
import { requestCurrentLocation } from "../../utils/location";

const statusTheme = {
  SAFE: { bg: "#dcfce7", text: "#166534" },
  EMERGENCY: { bg: "#fee2e2", text: "#991b1b" },
  POSSIBLE_RISK: { bg: "#fef3c7", text: "#92400e" },
  UNKNOWN: { bg: "#e5e7eb", text: "#374151" },
};

const cardActions = [
  {
    key: "SAFE",
    title: "I'm Safe",
    icon: "shield-checkmark-outline",
    bg: "#d7f5df",
    color: "#15803d",
  },
  {
    key: "EMERGENCY",
    title: "I Need Help",
    icon: "warning-outline",
    bg: "#fbe2e2",
    color: "#dc2626",
  },
  {
    key: "POSSIBLE_RISK",
    title: "Possible Risk",
    icon: "time-outline",
    bg: "#fef3c7",
    color: "#a16207",
  },
  {
    key: "HUB",
    title: "Emergency Hub",
    icon: "call-outline",
    bg: "#efe4ff",
    color: "#7e22ce",
  },
];

export default function HomeScreen({ navigation }) {
  const { user, refreshMe } = useAuth();
  const { events } = useSocketEvents();
  const [broadcasts, setBroadcasts] = useState([]);
  const [buddies, setBuddies] = useState([]);
  const [systemStatus, setSystemStatus] = useState({ alertLevel: "SAFE" });
  const [city, setCity] = useState("Locating city...");
  const [temperature, setTemperature] = useState("--°C");
  const [clock, setClock] = useState("--:--");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [working, setWorking] = useState(false);
  const [riskSecondsLeft, setRiskSecondsLeft] = useState(null);
  const [recentSos, setRecentSos] = useState(null);
  const [hideBroadcastBanner, setHideBroadcastBanner] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [helpOffers, setHelpOffers] = useState([]);
  const [helpOfferModalVisible, setHelpOfferModalVisible] = useState(false);
  const [currentHelpOffer, setCurrentHelpOffer] = useState(null);
  const [helpOfferedUsers, setHelpOfferedUsers] = useState([]);
  const [helpOfferInputVisible, setHelpOfferInputVisible] = useState(false);
  const [selectedBuddy, setSelectedBuddy] = useState(null);
  const [safetyCircleDisabled, setSafetyCircleDisabled] = useState(false);

  const isSmall = Dimensions.get("window").width < 390;

  const load = async () => {
    try {
      const [bRes, nearRes, sysRes, helpOffersRes] = await Promise.all([
        api.broadcasts(),
        api.nearbyUsers(5),
        api.systemStatus(),
        api.getPendingHelpOffers(),
      ]);
      setBroadcasts(bRes.broadcasts || []);
      const users = nearRes.users || [];
      setBuddies(users);
      setSafetyCircleDisabled(!!nearRes.disabled);
      setSystemStatus(sysRes.status || { alertLevel: "SAFE" });
      setHelpOffers(helpOffersRes.offers || []);

      // Check which users have been offered help
      const offeredIds = [];
      for (const buddy of users) {
        if (["EMERGENCY", "POSSIBLE_RISK"].includes(buddy.status)) {
          try {
            const res = await api.checkHelpOffered(buddy.id);
            if (res.hasOffered) {
              offeredIds.push(buddy.id);
            }
          } catch {
            // Ignore error for individual checks
          }
        }
      }
      setHelpOfferedUsers(offeredIds);
    } catch (err) {
      Alert.alert("Sync failed", err.message);
    }
  };

  const loadTopBarData = async () => {
    try {
      const loc =
        user?.location?.latitude && user?.location?.longitude
          ? {
              latitude: user.location.latitude,
              longitude: user.location.longitude,
            }
          : await requestCurrentLocation();

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m&timezone=auto`;
      const weather = await fetch(weatherUrl).then((r) => r.json());
      if (typeof weather?.current?.temperature_2m === "number") {
        setTemperature(`${Math.round(weather.current.temperature_2m)}°C`);
      }
      if (weather?.timezone) setTimezone(weather.timezone);

      const geo = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.latitude}&lon=${loc.longitude}`,
        { headers: { "User-Agent": "crisis-mode-app" } },
      ).then((r) => r.json());
      const resolved =
        geo?.address?.city ||
        geo?.address?.town ||
        geo?.address?.state_district ||
        geo?.address?.state;
      setCity(resolved || "Unknown City");
    } catch {
      setCity("City unavailable");
    }
  };

  useEffect(() => {
    load();
    loadTopBarData();
  }, []);

  // Show help offer modal when new offers arrive
  useEffect(() => {
    if (helpOffers.length > 0 && !currentHelpOffer && user?.status !== "SAFE") {
      setCurrentHelpOffer(helpOffers[0]);
      setHelpOfferModalVisible(true);
    }
  }, [helpOffers, currentHelpOffer, user?.status]);

  // Listen for help offer events
  useEffect(() => {
    const latest = events[0];
    if (
      latest?.type === "help_offered" &&
      latest.payload?.userId === user?.id
    ) {
      if (user?.status !== "SAFE") {
        setCurrentHelpOffer({
          _id: latest.payload.offerId,
          helperName: latest.payload.helperName,
          message: latest.payload.message,
        });
        setHelpOfferModalVisible(true);
      }
      setHelpOffers((prev) => [
        {
          _id: latest.payload.offerId,
          helperName: latest.payload.helperName,
          message: latest.payload.message,
        },
        ...prev,
      ]);
      load(); // Reload to get new help offers
    }
  }, [events, user?.id]);

  // Auto-hide broadcast banner after 10 minutes from server broadcast time
  useEffect(() => {
    if (broadcasts.length > 0 && broadcasts[0]) {
      const broadcastTime = new Date(
        broadcasts[0].timestamp || broadcasts[0].createdAt,
      ).getTime();
      const currentTime = Date.now();
      const timeElapsed = currentTime - broadcastTime;
      const tenMinutes = 10 * 60 * 1000;

      if (timeElapsed >= tenMinutes) {
        // Already past 10 minutes, hide immediately
        setHideBroadcastBanner(true);
      } else {
        // Show banner and hide after remaining time
        setHideBroadcastBanner(false);
        const remainingTime = tenMinutes - timeElapsed;
        const timer = setTimeout(() => {
          setHideBroadcastBanner(true);
        }, remainingTime);
        return () => clearTimeout(timer);
      }
    }
  }, [broadcasts[0]?._id]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const formatted = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone,
      });
      setClock(formatted);
    }, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  useEffect(() => {
    const changed = events[0]?.type;
    if (
      [
        "broadcast_created",
        "status_updated",
        "sos_created",
        "sos_updated",
        "profile_updated",
        "alert_level_updated",
      ].includes(changed)
    ) {
      load();
      refreshMe();
    }
  }, [events]);

  useEffect(() => {
    const latest = events[0];
    if (
      latest?.type === "status_updated" &&
      latest.payload?.userId &&
      latest.payload.userId === recentSos?.userId &&
      latest.payload.status === "SAFE"
    ) {
      setRecentSos(null);
    }
  }, [events, recentSos?.userId]);

  useEffect(() => {
    const latest = events[0];
    if (latest?.type === "sos_created") {
      // Do not show banner for your own SOS
      if (latest.payload?.userId && latest.payload.userId === user?.id) return;
      if (safetyCircleDisabled) return;

      // Only show SOS from safety circle members (within 5km)
      const sosUser = buddies.find((b) => b.id === latest.payload.userId);
      if (sosUser) {
        setRecentSos(latest.payload || null);
      }
    }
  }, [events, user?.id, buddies, safetyCircleDisabled]);

  useEffect(() => {
    if (!user?.riskCountdownEndsAt || user.status !== "POSSIBLE_RISK") return;
    // local countdown for UI
    const compute = () => {
      const ms = new Date(user.riskCountdownEndsAt).getTime() - Date.now();
      setRiskSecondsLeft(ms > 0 ? Math.ceil(ms / 1000) : 0);
    };
    compute();
    const uiId = setInterval(compute, 1000);

    // escalation watchdog
    const id = setInterval(async () => {
      if (new Date(user.riskCountdownEndsAt).getTime() <= Date.now()) {
        clearInterval(id);
        clearInterval(uiId);
        try {
          await api.updateStatus({ status: "EMERGENCY", autoCall: true });
          await api.createSos({
            mode: "AUTO_RISK_ESCALATION",
            notes: "Risk countdown elapsed",
          });
          await refreshMe();
          Alert.alert(
            "Escalated",
            "Possible risk timed out. Emergency alert sent to police.",
          );
        } catch (err) {
          Alert.alert("Escalation failed", err.message);
        }
      }
    }, 1000);
    return () => {
      clearInterval(id);
      clearInterval(uiId);
    };
  }, [user?.riskCountdownEndsAt, user?.status]);

  const showStatusModal = (status) => {
    setPendingStatus(status);
    setStatusModalVisible(true);
  };

  const updateStatus = async (status, opts = {}, userMessage = "") => {
    setWorking(true);
    try {
      const loc = await requestCurrentLocation();
      await api.updateLocation(loc);
      await api.updateStatus({ status, ...opts, userMessage });
      if (status === "EMERGENCY")
        await api.createSos({
          mode: "URGENT_HELP",
          notes: "Urgent help tapped",
          userMessage,
        });
      if (status === "POSSIBLE_RISK")
        await api.createSos({
          mode: "URGENT_HELP",
          notes: "Possible risk reported",
          userMessage,
        });
      await refreshMe();
      await load();
    } catch (err) {
      Alert.alert("Action failed", err.message);
    } finally {
      setWorking(false);
    }
  };

  const handleStatusModalSubmit = (userMessage) => {
    setStatusModalVisible(false);
    if (pendingStatus === "SAFE") {
      updateStatus("SAFE", {});
    } else if (pendingStatus === "EMERGENCY") {
      updateStatus("EMERGENCY", {}, userMessage);
    } else if (pendingStatus === "POSSIBLE_RISK") {
      updateStatus("POSSIBLE_RISK", { countdownMinutes: 5 }, userMessage);
    }
    setPendingStatus(null);
  };

  const handleOfferHelp = (userId, userName) => {
    setSelectedBuddy({ id: userId, name: userName });
    setHelpOfferInputVisible(true);
  };

  const handleSubmitHelpOffer = async (message) => {
    if (!selectedBuddy) return;
    try {
      await api.offerHelp({ userId: selectedBuddy.id, message });
      setHelpOfferedUsers([...helpOfferedUsers, selectedBuddy.id]);
      Alert.alert(
        "Help Offered",
        `Your offer to help ${selectedBuddy.name} has been sent.`,
      );
      setHelpOfferInputVisible(false);
      setSelectedBuddy(null);
    } catch (err) {
      Alert.alert("Failed", err.message);
      setHelpOfferInputVisible(false);
      setSelectedBuddy(null);
    }
  };

  const handleAcceptHelp = async (markSafe) => {
    if (!currentHelpOffer) return;
    try {
      await api.respondToHelpOffer(currentHelpOffer._id, {
        status: "ACCEPTED",
        changeStatusToSafe: markSafe,
      });
      if (markSafe) {
        await updateStatus("SAFE", {});
      }
      Alert.alert("Accepted", "You have accepted the help offer.");
      setHelpOfferModalVisible(false);
      setHelpOffers((prev) =>
        prev.filter((offer) => offer._id !== currentHelpOffer._id),
      );
      setCurrentHelpOffer(null);
      await load();
    } catch (err) {
      Alert.alert("Failed", err.message);
    }
  };

  const handleDeclineHelp = async () => {
    if (!currentHelpOffer) return;
    try {
      await api.respondToHelpOffer(currentHelpOffer._id, {
        status: "DECLINED",
      });
      setHelpOfferModalVisible(false);
      setHelpOffers((prev) =>
        prev.filter((offer) => offer._id !== currentHelpOffer._id),
      );
      setCurrentHelpOffer(null);
      await load();
    } catch (err) {
      Alert.alert("Failed", err.message);
    }
  };

  const countdownText = useMemo(() => {
    if (!user?.riskCountdownEndsAt || user.status !== "POSSIBLE_RISK")
      return "";
    if (riskSecondsLeft === null) return "";
    if (riskSecondsLeft <= 0) return "Escalating...";
    return `Escalates in ${riskSecondsLeft}s if not marked safe`;
  }, [user?.riskCountdownEndsAt, user?.status, riskSecondsLeft]);

  const currentTheme = statusTheme[user?.status || "UNKNOWN"];
  const isHighAlert = systemStatus?.alertLevel === "HIGH";

  const sosBuddy = recentSos && buddies.find((b) => b.id === recentSos.userId);
  const sosBuddyDistance = sosBuddy?.distanceKm;
  const sosCanReceiveHelp =
    sosBuddy?.safetySettings?.receiveHelpRequests !== false;

  return (
    <ScreenContainer>
      {/* <ProfileHeader />
      <ProfileCompletionIndicator /> */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {city &&
          !city.startsWith("Locating") &&
          !city.includes("unavailable") &&
          !temperature.startsWith("--") && (
            <SectionCard style={styles.miniTopBar}>
              <View style={styles.cityRow}>
                <Ionicons name="location-outline" size={16} color="#2563eb" />
                <Text style={styles.cityText}>{city}</Text>
              </View>
              <Text style={styles.weatherText}>
                {temperature} • {clock}
              </Text>
            </SectionCard>
          )}

        <SectionCard
          style={[styles.hero, isHighAlert ? styles.heroHigh : styles.heroSafe]}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Crisis Alert Level</Text>
              <Text style={styles.heroTitle}>
                {isHighAlert ? "HIGH ALERT" : "SAFE"}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {isHighAlert ? "Active" : "Normal"}
              </Text>
            </View>
          </View>
          <Text style={styles.heroBody}>
            {isHighAlert
              ? systemStatus.incidentType &&
                systemStatus.incidentType !== "NONE"
                ? `Global crisis mode active (${systemStatus.incidentType}). Follow official instructions on broadcasts and local authorities.`
                : "Multiple danger zones detected. Follow official instructions."
              : "City status is normal. Monitoring continues in background."}
          </Text>
          <View
            style={[styles.statePill, { backgroundColor: currentTheme.bg }]}
          >
            <Text style={[styles.stateText, { color: currentTheme.text }]}>
              Your Status: {user?.status || "UNKNOWN"}
            </Text>
            {countdownText ? (
              <Text style={[styles.stateSubText, { color: currentTheme.text }]}>
                {countdownText}
              </Text>
            ) : null}
          </View>
          {working && (
            <View style={styles.workingRow}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.workingText}>Updating your status…</Text>
            </View>
          )}
        </SectionCard>

        {recentSos && !safetyCircleDisabled && (
          <SectionCard style={styles.sosBanner}>
            <View style={styles.sosHeaderRow}>
              <Text style={styles.sosTitle}>Safety Circle Emergency Alert</Text>
              <TouchableOpacity onPress={() => setRecentSos(null)}>
                <Text style={styles.sosDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sosBody}>
              {recentSos.name || "A nearby user"} has triggered an emergency (
              {recentSos.mode || "SOS"}).
            </Text>
            {recentSos.userMessage && (
              <Text style={styles.sosMessage}>"{recentSos.userMessage}"</Text>
            )}
            {typeof sosBuddyDistance === "number" && (
              <Text style={styles.sosMeta}>
                Approx. {sosBuddyDistance} km from you.
              </Text>
            )}
            <View style={styles.sosActions}>
              {recentSos.userId &&
                sosCanReceiveHelp &&
                !helpOfferedUsers.includes(recentSos.userId) && (
                  <TouchableOpacity
                    style={styles.sosOfferHelpBtn}
                    onPress={() =>
                      handleOfferHelp(
                        recentSos.userId,
                        recentSos.name || "User",
                      )
                    }
                  >
                    <Ionicons name="hand-left" size={14} color="#fff" />
                    <Text style={styles.sosOfferHelpText}>Offer Help</Text>
                  </TouchableOpacity>
                )}
              {recentSos.userId && !sosCanReceiveHelp && (
                <View style={styles.sosHelpOfferedBadge}>
                  <Ionicons name="alert-circle" size={14} color="#f59e0b" />
                  <Text style={styles.sosHelpOfferedText}>Help Disabled</Text>
                </View>
              )}
              {recentSos.userId &&
                helpOfferedUsers.includes(recentSos.userId) && (
                  <View style={styles.sosHelpOfferedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#16a34a"
                    />
                    <Text style={styles.sosHelpOfferedText}>Help Offered</Text>
                  </View>
                )}
            </View>
          </SectionCard>
        )}

        <StatusModal
          visible={statusModalVisible}
          status={pendingStatus}
          onClose={() => {
            setStatusModalVisible(false);
            setPendingStatus(null);
          }}
          onSubmit={handleStatusModalSubmit}
        />

        <HelpOfferModal
          visible={helpOfferModalVisible}
          offer={currentHelpOffer}
          onAccept={handleAcceptHelp}
          onDecline={handleDeclineHelp}
          onClose={() => setHelpOfferModalVisible(false)}
        />

        <HelpOfferInputModal
          visible={helpOfferInputVisible}
          userName={selectedBuddy?.name}
          onClose={() => {
            setHelpOfferInputVisible(false);
            setSelectedBuddy(null);
          }}
          onSubmit={handleSubmitHelpOffer}
        />

        <View style={styles.actionGrid}>
          {cardActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={[
                styles.actionCard,
                isSmall && styles.actionCardSmall,
                { backgroundColor: action.bg },
              ]}
              disabled={working && action.key !== "HUB"}
              onPress={() => {
                if (action.key === "SAFE") return updateStatus("SAFE", {});
                if (action.key === "EMERGENCY")
                  return showStatusModal("EMERGENCY");
                if (action.key === "POSSIBLE_RISK")
                  return showStatusModal("POSSIBLE_RISK");
                navigation.navigate("SOS");
              }}
            >
              <Ionicons name={action.icon} size={24} color={action.color} />
              <Text
                style={[
                  styles.actionText,
                  isSmall && styles.actionTextSmall,
                  { color: action.color },
                ]}
              >
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!hideBroadcastBanner && <BroadcastBanner alert={broadcasts[0]} />}

        <SectionCard style={{ backgroundColor: "#f3f4f6" }}>
          <Text style={styles.sectionTitle}>Recent Broadcasts</Text>
          {broadcasts.slice(0, 5).map((b) => {
            const alertColors = {
              Advisory: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
              Warning: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
              Emergency: { bg: "#fecaca", border: "#dc2626", text: "#991b1b" },
            };
            const theme = alertColors[b.alertType] || alertColors.Warning;

            return (
              <View
                key={b._id}
                style={[
                  styles.broadcastItem,
                  {
                    backgroundColor: theme.bg,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.broadcastType, { color: theme.text }]}>
                  {b.alertType} • {b.zone}
                </Text>
                <Text style={[styles.broadcastTitle, { color: theme.text }]}>
                  {b.title}
                </Text>
                <Text style={[styles.broadcastMsg, { color: theme.text }]}>
                  {b.message}
                </Text>
              </View>
            );
          })}
        </SectionCard>

        <SectionCard style={{ backgroundColor: "#f3f4f6" }}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Safety Circle (within 5km)</Text>
            <Text style={styles.liveTag}>● Live</Text>
          </View>
          {safetyCircleDisabled ? (
            <Text style={styles.empty}>
              Safety Circle is hidden. Enable “Allow nearby users to see me” to view nearby users.
            </Text>
          ) : buddies.length === 0 ? (
            <Text style={styles.empty}>No nearby users detected</Text>
          ) : null}
          {buddies.map((buddy) => {
            const needsHelp = ["EMERGENCY", "POSSIBLE_RISK"].includes(
              buddy.status,
            );
            const displayName = needsHelp ? buddy.name : "Anonymous User";
            const canReceiveHelp =
              buddy.safetySettings?.receiveHelpRequests !== false;

            return (
              <View key={buddy.id} style={styles.buddyRow}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text style={styles.buddyName}>{displayName}</Text>
                    {needsHelp && (
                      <Ionicons
                        name={
                          buddy.status === "EMERGENCY" ? "alert-circle" : "time"
                        }
                        size={14}
                        color={
                          buddy.status === "EMERGENCY" ? "#dc2626" : "#f59e0b"
                        }
                      />
                    )}
                  </View>
                  <Text style={styles.buddyMeta}>
                    {buddy.distanceKm} km away
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={[
                      styles.buddyStatus,
                      buddy.status === "EMERGENCY" && styles.statusEmergency,
                      buddy.status === "POSSIBLE_RISK" && styles.statusRisk,
                    ]}
                  >
                    {buddy.status}
                  </Text>
                  {needsHelp && canReceiveHelp && !helpOfferedUsers.includes(buddy.id) && (
                    <TouchableOpacity
                      style={styles.helpBtn}
                      onPress={() => handleOfferHelp(buddy.id, buddy.name)}
                    >
                      <Ionicons
                        name="hand-left-outline"
                        size={12}
                        color="#2563eb"
                      />
                      <Text style={styles.helpBtnText}>Offer Help</Text>
                    </TouchableOpacity>
                  )}
                  {needsHelp && !canReceiveHelp && (
                    <View style={styles.helpOfferedBadge}>
                      <Ionicons name="alert-circle" size={12} color="#f59e0b" />
                      <Text style={styles.helpOfferedText}>Help Disabled</Text>
                    </View>
                  )}
                  {needsHelp && helpOfferedUsers.includes(buddy.id) && (
                    <View style={styles.helpOfferedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color="#16a34a"
                      />
                      <Text style={styles.helpOfferedText}>Help Offered</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingVertical: 10, paddingBottom: 24 },
  miniTopBar: {
    backgroundColor: "#eef2ff",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cityRow: { flexDirection: "row", alignItems: "center" },
  cityText: { marginLeft: 6, color: "#1e3a8a", fontWeight: "700" },
  weatherText: { color: "#1f2937", fontWeight: "600", fontSize: 12 },
  hero: { borderRadius: 14 },
  heroHigh: { backgroundColor: "#ef4444" },
  heroSafe: { backgroundColor: "#16a34a" },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: { color: "#fee2e2", fontSize: 13 },
  heroTitle: { color: "#fff", fontSize: 34, fontWeight: "700" },
  heroBody: { marginTop: 8, color: "#fff", fontSize: 14 },
  badge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  statePill: { marginTop: 12, borderRadius: 10, padding: 10 },
  stateText: { fontWeight: "700", fontSize: 13 },
  stateSubText: { fontSize: 12, marginTop: 2 },
  workingRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  workingText: {
    color: "#fef9c3",
    fontSize: 12,
    fontWeight: "500",
  },
  sosBanner: {
    marginTop: 10,
    backgroundColor: "#fef2f2",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  sosTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#b91c1c",
    marginBottom: 2,
  },
  sosHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  sosDismiss: {
    fontSize: 11,
    color: "#b91c1c",
    fontWeight: "600",
  },
  sosBody: {
    color: "#7f1d1d",
    fontSize: 13,
  },
  sosMeta: {
    marginTop: 4,
    color: "#9f1239",
    fontSize: 12,
  },
  sosMessage: {
    marginTop: 6,
    color: "#7f1d1d",
    fontSize: 13,
    fontStyle: "italic",
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#fca5a5",
  },
  sosActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  sosOfferHelpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#2563eb",
    borderRadius: 8,
  },
  sosOfferHelpText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  sosHelpOfferedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#dcfce7",
    borderRadius: 8,
  },
  sosHelpOfferedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16a34a",
  },
  actionGrid: {
    marginHorizontal: 12,
    gap: 10,
    marginBottom: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionCard: {
    width: "48.8%",
    minHeight: 86,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionCardSmall: {
    width: "100%",
    minHeight: 68,
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 14,
  },
  actionText: { fontSize: 16, fontWeight: "600" },
  actionTextSmall: { fontSize: 15 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 19, fontWeight: "600", color: "#111827" },
  liveTag: { color: "#16a34a", fontWeight: "700" },
  empty: { color: "#6b7280", marginTop: 8 },
  buddyRow: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buddyName: { fontWeight: "600", color: "#111827" },
  buddyMeta: { color: "#6b7280", fontSize: 12 },
  buddyStatus: { color: "#1f2937", fontSize: 12, fontWeight: "600" },
  statusEmergency: { color: "#dc2626" },
  statusRisk: { color: "#f59e0b" },
  helpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#dbeafe",
    borderRadius: 6,
  },
  helpBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563eb",
  },
  helpOfferedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#dcfce7",
    borderRadius: 6,
  },
  helpOfferedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16a34a",
  },
  broadcastItem: { marginTop: 8, borderRadius: 10, padding: 10 },
  broadcastType: { fontSize: 12, fontWeight: "600" },
  broadcastTitle: { fontWeight: "700", marginTop: 2 },
  broadcastMsg: { marginTop: 2, fontSize: 13 },
});
