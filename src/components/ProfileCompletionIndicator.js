import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export default function ProfileCompletionIndicator() {
  const { user } = useAuth();

  const completionData = useMemo(() => {
    if (!user) return { percentage: 0, missingFields: [], completedFields: [] };

    const fields = [
      { key: "phone", label: "Phone Number", value: user.phone, required: true },
      { key: "name", label: "Full Name", value: user.name, required: true },
      { key: "username", label: "Username", value: user.username, required: true },
      { key: "dateOfBirth", label: "Date of Birth", value: user.dateOfBirth, required: true },
      { key: "address", label: "Address", value: user.address?.fullAddress, required: true },
      { key: "aadhaarHash", label: "Aadhaar", value: user.aadhaarHash, required: true },
      { key: "profilePhoto", label: "Profile Photo", value: user.profilePhoto, required: false },
      { key: "organizationRole", label: "Role", value: user.organizationRole, required: true },
      { key: "bloodGroup", label: "Blood Group", value: user.bloodGroup, required: false },
      { key: "medicalCondition", label: "Medical Info", value: user.medicalCondition, required: false },
      { key: "locationAccess", label: "Location Permission", value: user.permissions?.locationAccess !== "denied", required: true },
      { key: "emergencyContacts", label: "Emergency Contacts", value: true, required: true }, // Checked separately via API
    ];

    const required = fields.filter(f => f.required);
    const completed = required.filter(f => f.value);
    const missing = required.filter(f => !f.value);
    const optional = fields.filter(f => !f.required);
    const completedOptional = optional.filter(f => f.value);

    const percentage = Math.round((completed.length / required.length) * 100);

    return {
      percentage,
      missingFields: missing.map(f => f.label),
      completedFields: completed.map(f => f.label),
      optionalCompleted: completedOptional.length,
      optionalTotal: optional.length
    };
  }, [user]);

  if (!user) return null;

  const isComplete = completionData.percentage === 100;
  const progressColor = completionData.percentage >= 80 ? "#16a34a" : completionData.percentage >= 50 ? "#f59e0b" : "#dc2626";

  if (isComplete) return null;

  return (
      <View style={[styles.container, isComplete && styles.containerComplete]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={isComplete ? "checkmark-circle" : "person-circle-outline"} 
            size={24} 
            color={isComplete ? "#16a34a" : "#6b7280"} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isComplete ? "Profile Complete!" : "Complete Your Profile"}
          </Text>
          <Text style={styles.subtitle}>
            {isComplete 
              ? `All required fields filled • ${completionData.optionalCompleted}/${completionData.optionalTotal} optional`
              : `${completionData.percentage}% complete • ${completionData.missingFields.length} fields missing`
            }
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>

      {!isComplete && (
        <>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${completionData.percentage}%`, backgroundColor: progressColor }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: progressColor }]}>
              {completionData.percentage}%
            </Text>
          </View>

          {completionData.missingFields.length > 0 && (
            <View style={styles.missingFieldsContainer}>
              <Text style={styles.missingLabel}>Missing:</Text>
              <Text style={styles.missingFields}>
                {completionData.missingFields.join(", ")}
              </Text>
            </View>
          )}
        </>
      )}

      {isComplete && completionData.optionalCompleted < completionData.optionalTotal && (
        <Text style={styles.optionalText}>
          💡 Add optional info like blood group for emergency responders
        </Text>
      )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#fef3c7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  containerComplete: {
    borderColor: "#dcfce7"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  iconContainer: {
    marginRight: 12
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280"
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 8
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4
  },
  progressText: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "right"
  },
  missingFieldsContainer: {
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap"
  },
  missingLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400e",
    marginRight: 4
  },
  missingFields: {
    fontSize: 12,
    color: "#92400e",
    flex: 1
  },
  optionalText: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 4
  }
});
