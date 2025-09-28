import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useTheme } from '../contexts/ThemeContext';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { theme, toggleTheme, isDarkMode } = useTheme();
  
  // User profile states
  const [name, setName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  
  // App preferences states
  const [isMetricSystem, setIsMetricSystem] = useState(true);

  const handleSaveName = () => {
    // TODO: Implement name update logic with Firebase
    setIsEditingName(false);
    Alert.alert('Success', 'Name updated successfully');
  };

  const handleSaveEmail = () => {
    // TODO: Implement email update logic with Firebase
    setIsEditingEmail(false);
    Alert.alert('Success', 'Email updated successfully');
  };

  const handleToggleDarkMode = () => {
    toggleTheme();
    Alert.alert('Info', 'Dark mode preference saved');
  };

  const handleToggleUnits = () => {
    setIsMetricSystem(!isMetricSystem);
    // TODO: Implement unit system toggle logic
    Alert.alert('Info', `Switched to ${!isMetricSystem ? 'Metric' : 'Imperial'} system`);
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* User Profile Section */}
                          <View style={styles.section}>
           <Text style={styles.sectionTitle}>Profile</Text>
           
           {/* Name Setting */}
           <View style={styles.settingCard}>
             <View style={styles.settingHeader}>
               <View style={styles.settingIcon}>
                 <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                 </View>
                <Text style={styles.settingLabel}>Name</Text>
              <TouchableOpacity 
                onPress={() => setIsEditingName(!isEditingName)}
                style={styles.editButton}
              >
                                 <Ionicons 
                   name={isEditingName ? "checkmark" : "pencil"} 
                   size={18} 
                   color={theme.colors.primary} 
                 />
              </TouchableOpacity>
            </View>
            {isEditingName ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  autoFocus
                  onSubmitEditing={handleSaveName}
                />
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveName}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.settingValue}>{name || 'Not set'}</Text>
            )}
          </View>

          {/* Email Setting */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
                             <View style={styles.settingIcon}>
                 <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
               </View>
               <Text style={styles.settingLabel}>Email</Text>
               <TouchableOpacity 
                 onPress={() => setIsEditingEmail(!isEditingEmail)}
                 style={styles.editButton}
               >
                 <Ionicons 
                   name={isEditingEmail ? "checkmark" : "pencil"} 
                   size={18} 
                   color={theme.colors.primary} 
                />
              </TouchableOpacity>
            </View>
            {isEditingEmail ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  onSubmitEditing={handleSaveEmail}
                />
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveEmail}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.settingValue}>{email || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* App Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {/* Dark Mode Toggle */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
                             <View style={styles.settingLeft}>
                 <View style={styles.settingIcon}>
                   <Ionicons name="moon-outline" size={20} color={theme.colors.primary} />
                 </View>
                 <View style={styles.settingContent}>
                   <Text style={styles.settingLabel}>Dark Mode</Text>
                   <Text style={styles.settingDescription}>
                     Switch between light and dark theme
                   </Text>
                 </View>
               </View>
               <Switch
                 value={isDarkMode}
                 onValueChange={handleToggleDarkMode}
                 trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                 thumbColor={theme.colors.white}
              />
            </View>
          </View>

          {/* Unit System Toggle */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
                             <View style={styles.settingLeft}>
                 <View style={styles.settingIcon}>
                   <Ionicons name="speedometer-outline" size={20} color={theme.colors.primary} />
                 </View>
                 <View style={styles.settingContent}>
                   <Text style={styles.settingLabel}>Unit System</Text>
                   <Text style={styles.settingDescription}>
                     {isMetricSystem ? 'Metric (km, kg)' : 'Imperial (miles, lbs)'}
                   </Text>
                 </View>
               </View>
               <Switch
                 value={isMetricSystem}
                 onValueChange={handleToggleUnits}
                 trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                 thumbColor={theme.colors.white}
              />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
                             <View style={styles.settingLeft}>
                 <View style={styles.settingIcon}>
                   <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                 </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>App Version</Text>
                  <Text style={styles.settingDescription}>1.0.0</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowColor: theme.colors.shadow,
    borderWidth: theme.isDark ? 1 : 0,
    borderColor: theme.colors.border,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 32,
    marginTop: 4,
  },
  editButton: {
    padding: 4,
  },
  inputContainer: {
    marginLeft: 32,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    color: theme.colors.text,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen; 