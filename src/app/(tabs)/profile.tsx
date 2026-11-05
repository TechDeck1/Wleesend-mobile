import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

import { Button, Card, LinkRow, Screen, AppText, Tile } from '@/components/UiComponents';
import { useStore } from '@/store';
import { fonts, useTheme } from '@/theme';
import { BASE_URL } from '@/config/api';
import { base64ToDataUri, uploadProfileImage } from '@/services/profileService';

type SelectedPhoto = { uri: string; name: string; type: string };

function resolveImageUrl(path: string | null | undefined): string | null {
  const value = path?.trim();
  if (!value) return null;
  if (/^data:/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;
  // Raw base64 (JPEG starts with "/9j/", PNG with "iVBOR") - check before treating "/" as a path.
  if (value.startsWith('/9j/') || value.startsWith('iVBOR')) return base64ToDataUri(value);
  if (value.startsWith('/')) return `${BASE_URL.replace(/\/+$/, '')}${value}`;
  return value;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { user: userProfile, signOut, updateProfilePic } = useStore();
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhoto | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    router.replace(ROUTES.WELCOME);
  };

  const accountLinks = (
    <Card>
      <LinkRow icon="info" label="About Wleesend" onPress={() => router.push(ROUTES.ABOUT)} />
      <LinkRow icon="mail" label="Support" onPress={() => router.push(ROUTES.SUPPORT)} last />
    </Card>
  );

  if (!userProfile) {
    return (
      <Screen gap={18}>
        <AppText variant="title" accessibilityRole="header">
          My profile
        </AppText>
        <Card style={{ padding: 20, alignItems: 'center', gap: 10 }}>
          <Tile icon="personAdd" size={56} />
          <AppText variant="heading" style={{ fontSize: 18 }}>
            You&rsquo;re signed out
          </AppText>
          <AppText variant="muted" style={{ textAlign: 'center' }}>
            Create an account to send credit and see your transactions.
          </AppText>
          <Button
            label="Create account"
            onPress={() => router.push(ROUTES.SIGNUP)}
            style={{ alignSelf: 'stretch', marginTop: 6 }}
          />
        </Card>
        {accountLinks}
      </Screen>
    );
  }

  const renderProfileDetail = (label: string, value: string) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 54,
        borderBottomWidth: 1,
        borderBottomColor: theme.lineSoft,
      }}
    >
      <AppText variant="muted">{label}</AppText>
      <AppText variant="strong">{value}</AppText>
    </View>
  );

  const avatarUrl = resolveImageUrl(userProfile.profilePic);
  const avatarSource = selectedPhoto?.uri ?? (avatarLoadFailed ? null : avatarUrl);

  const choosePhoto = async () => {
    setPhotoError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      const mimeType = asset.mimeType?.toLowerCase();
      const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? 'profile-photo';
      const extension = fileName.split('.').pop()?.toLowerCase();
      const isPng = mimeType === 'image/png' || extension === 'png';
      const isJpeg = mimeType === 'image/jpeg' || extension === 'jpg' || extension === 'jpeg';
      if (!isPng && !isJpeg) {
        setPhotoError('Choose a PNG or JPEG image.');
        return;
      }
      setSelectedPhoto({
        uri: asset.uri,
        name: /\.(png|jpe?g)$/i.test(fileName) ? fileName : `${fileName}.${isPng ? 'png' : 'jpg'}`,
        type: isPng ? 'image/png' : 'image/jpeg',
      });
      setAvatarLoadFailed(false);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Unable to select a photo.');
    }
  };

  const savePhoto = async () => {
    if (!selectedPhoto) return;
    if (!userProfile.userId) {
      setPhotoError('Missing user id. Please sign in again.');
      return;
    }
    setPhotoError(null);
    setUploadProgress(0);
    try {
      // Returns a ready-to-render data URI built from the backend's base64 response.
      const imageDataUri = await uploadProfileImage(
        selectedPhoto,
        String(userProfile.userId),
        setUploadProgress,
      );
      await updateProfilePic(imageDataUri);
      setSelectedPhoto(null);
      setAvatarLoadFailed(false);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'The photo upload failed. Please try again.');
    } finally {
      setUploadProgress(null);
    }
  };

  return (
    <Screen gap={18}>
      <AppText variant="title" accessibilityRole="header">
        My profile
      </AppText>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatarSource ? (
            <Image
              source={{ uri: avatarSource }}
              onError={() => setAvatarLoadFailed(true)}
              onLoad={() => setAvatarLoadFailed(false)}
              style={{ width: 56, height: 56, borderRadius: 28 }}
              accessibilityLabel="Profile photo"
            />
          ) : (
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 19,
                color: theme.onBrand,
              }}
            >
              {userProfile.firstName[0]}
              {userProfile.lastName[0]}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="heading" style={{ fontSize: 18 }}>
            {userProfile.firstName} {userProfile.lastName}
          </AppText>
          <AppText variant="small" style={{ fontSize: 14 }}>
            {userProfile.email}
          </AppText>
          <Pressable
            onPress={choosePhoto}
            accessibilityRole="button"
            disabled={uploadProgress !== null}
            style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
          >
            <Text style={{ color: theme.accentText, fontSize: 14, fontWeight: '600' }}>Edit photo</Text>
          </Pressable>
        </View>
      </View>

      {selectedPhoto ? (
        <View style={{ gap: 10 }}>
          <AppText variant="small">Preview your new profile photo</AppText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => {
                setSelectedPhoto(null);
                setPhotoError(null);
              }}
              accessibilityRole="button"
              disabled={uploadProgress !== null}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: theme.ink, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={savePhoto}
              accessibilityRole="button"
              disabled={uploadProgress !== null}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: 12,
                backgroundColor: theme.accent,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              {uploadProgress !== null ? <ActivityIndicator color={theme.onBrand} /> : null}
              <Text style={{ color: theme.onBrand, fontWeight: '600' }}>
                {uploadProgress !== null ? `Uploading ${uploadProgress}%` : 'Save photo'}
              </Text>
            </Pressable>
          </View>
          {uploadProgress !== null ? (
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: uploadProgress }}
              style={{ height: 4, borderRadius: 2, backgroundColor: theme.line, overflow: 'hidden' }}
            >
              <View style={{ width: `${uploadProgress}%`, height: 4, backgroundColor: theme.accent }} />
            </View>
          ) : null}
        </View>
      ) : null}
      {photoError ? (
        <Text accessibilityLiveRegion="polite" style={{ color: theme.accentText, fontSize: 14 }}>
          {photoError}
        </Text>
      ) : null}

      <Card style={{ paddingHorizontal: 16 }}>
        {renderProfileDetail('First name', userProfile.firstName)}
        {renderProfileDetail('Last name', userProfile.lastName)}
        {userProfile.phone ? renderProfileDetail('Phone', userProfile.phone) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: theme.lineSoft,
          }}
        >
          <AppText variant="muted">Email</AppText>
          <View style={{ alignItems: 'flex-end', paddingTop: 10 }}>
            <AppText variant="strong">{userProfile.email}</AppText>
            <Pressable
              onPress={() => router.push(ROUTES.CHANGE_EMAIL)}
              accessibilityRole="button"
              style={{ height: 44, justifyContent: 'center', marginTop: -6 }}
            >
              <Text
                style={{
                  color: theme.accentText,
                  fontSize: 14,
                  fontWeight: '600',
                }}
              >
                Change email
              </Text>
            </Pressable>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 68,
          }}
        >
          <AppText variant="muted">Password</AppText>
          <Pressable
            onPress={() => router.push(ROUTES.RESET_PASSWORD)}
            accessibilityRole="button"
            style={{
              height: 44,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: theme.accentTint,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: theme.accentTintText,
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              Reset password
            </Text>
          </Pressable>
        </View>
      </Card>

      {accountLinks}

      <Button variant="outline" icon="logout" label="Log out" onPress={handleSignOut} />
    </Screen>
  );
}