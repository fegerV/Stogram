import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@store/authStore';
import apiService from '@services/api';
import { COLORS } from '@utils/config';

const EditProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    displayName: '',
    status: '',
    bio: '',
  });

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const userData = await apiService.getMe();
      setFormData({
        displayName: userData.displayName || '',
        status: userData.status || '',
        bio: userData.bio || '',
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      (response) => {
        if (response.didCancel) {
          return;
        }

        if (response.errorCode) {
          Alert.alert('Error', 'Failed to pick image');
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          
          if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
            Alert.alert('Error', 'Image size must be less than 5MB');
            return;
          }

          setAvatarUri(asset.uri || null);
          setAvatarFile({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'avatar.jpg',
          });
        }
      }
    );
  };

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setSaving(true);
    
    const optimisticUser = {
      ...user,
      displayName: formData.displayName,
      status: formData.status,
      bio: formData.bio,
    };
    setUser(optimisticUser);

    try {
      const formDataToSend = new FormData();
      
      if (formData.displayName !== user?.displayName) {
        formDataToSend.append('displayName', formData.displayName);
      }
      if (formData.status !== (user?.status || '')) {
        formDataToSend.append('status', formData.status);
      }
      if (formData.bio !== (user?.bio || '')) {
        formDataToSend.append('bio', formData.bio);
      }
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      const updatedUser = await apiService.updateProfile(formDataToSend);
      setUser(updatedUser);
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setUser(user);
      
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={48} color={COLORS.gray} />
            </View>
          )}
          <View style={styles.editAvatarButton}>
            <Icon name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.changePhotoText}>Tap to change photo</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.displayName}
            onChangeText={(text) => setFormData({ ...formData, displayName: text })}
            placeholder="Enter your display name"
            placeholderTextColor={COLORS.gray}
            maxLength={100}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Status</Text>
          <TextInput
            style={styles.input}
            value={formData.status}
            onChangeText={(text) => setFormData({ ...formData, status: text })}
            placeholder="What's your status?"
            placeholderTextColor={COLORS.gray}
            maxLength={100}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder="Tell us about yourself"
            placeholderTextColor={COLORS.gray}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{formData.bio.length}/500</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f7f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f7f9fa',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
