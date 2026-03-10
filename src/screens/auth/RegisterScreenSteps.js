// This file contains the JSX for steps 2-9 of the registration screen
// To be inserted into RegisterScreen.js after step 1

export const additionalStyles = {
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginBottom: 12
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 15
  },
  eyeBtn: {
    padding: 12
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 12
  },
  photoButtonText: {
    color: "#2563eb",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 12
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  roleOptionSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb"
  },
  roleRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  roleRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb"
  },
  roleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827"
  },
  contactCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827"
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  addButtonText: {
    color: "#2563eb",
    fontWeight: "600",
    marginLeft: 8
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#374151",
    flex: 1
  },
  permissionCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  permissionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827"
  },
  permissionStatus: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2
  },
  permissionButton: {
    backgroundColor: "#2563eb",
    borderRadius: 6,
    padding: 10,
    alignItems: "center"
  },
  idProofPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12
  },
  verifyingCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 12
  },
  verifyingText: {
    fontSize: 14,
    color: "#1e40af",
    fontWeight: "600",
    marginTop: 12
  }
};

export const renderSteps = () => `
/* Step 2: Personal Details */
{step === 2 && (
  <View style={styles.stepContainer}>
    <Text style={styles.stepTitle}>👤 Personal Information</Text>
    <Text style={styles.stepDescription}>Complete your profile with eKYC details</Text>
    
    <TextInput
      style={styles.input}
      placeholder="Full Name *"
      value={name}
      onChangeText={setName}
      autoCapitalize="words"
    />
    
    <TextInput
      style={styles.input}
      placeholder="Username *"
      value={username}
      onChangeText={setUsername}
      autoCapitalize="none"
    />
    
    <View style={styles.passwordWrap}>
      <TextInput
        style={styles.passwordInput}
        placeholder="Password *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
      </TouchableOpacity>
    </View>
    
    <TextInput
      style={styles.input}
      placeholder="Confirm Password *"
      value={confirmPassword}
      onChangeText={setConfirmPassword}
      secureTextEntry={!showPassword}
      autoCapitalize="none"
    />
    
    <TextInput
      style={styles.input}
      placeholder="Date of Birth (YYYY-MM-DD) *"
      value={dateOfBirth}
      onChangeText={setDateOfBirth}
    />
    
    <TextInput
      style={styles.input}
      placeholder="Full Address *"
      value={address}
      onChangeText={setAddress}
      multiline
      numberOfLines={3}
    />
    
    <TextInput
      style={styles.input}
      placeholder="Aadhaar Number (12 digits) *"
      value={aadhaarNumber}
      onChangeText={setAadhaarNumber}
      keyboardType="number-pad"
      maxLength={12}
    />
    
    <TouchableOpacity style={styles.photoButton} onPress={pickProfilePhoto}>
      <Ionicons name="camera-outline" size={20} color="#2563eb" />
      <Text style={styles.photoButtonText}>
        {profilePhoto ? "Change Profile Photo" : "Add Profile Photo (Optional)"}
      </Text>
    </TouchableOpacity>
    
    {profilePhoto && (
      <Image source={{ uri: profilePhoto }} style={styles.photoPreview} />
    )}
    
    <TouchableOpacity style={styles.primaryButton} onPress={validateStep2}>
      <Text style={styles.buttonText}>Continue</Text>
    </TouchableOpacity>
  </View>
)}
`;
