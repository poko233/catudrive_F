import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Trash2, Upload } from "lucide-react-native";
import { useTheme } from "@/theme/useTheme";
import Toast from "react-native-toast-message";

interface ImageUploaderProps {
  label: string;
  description?: string;
  currentImageUrl?: string | null;
  onUpload: (file: { uri: string; name: string; type: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  maxSizeMB?: number;
  aspectRatio?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  description,
  currentImageUrl,
  onUpload,
  onDelete,
  maxSizeMB = 2,
  aspectRatio,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWebFileChange = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const uri = e.target?.result as string;
      setPreview(uri);
      setLoading(true);

      try {
        const fileData = {
          uri: uri,
          name: file.name,
          type: file.type,
        };
        await onUpload(fileData);
        Toast.show({
          type: "success",
          text1: "Imagen actualizada",
        });
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error?.message,
        });
        setPreview(null);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const pickImage = async () => {
    if (Platform.OS === "web") {
      fileInputRef.current?.click();
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        const file = {
          uri: asset.uri,
          name: asset.fileName || "image.jpg",
          type: asset.mimeType || "image/jpeg",
        };

        setPreview(asset.uri);
        setLoading(true);

        try {
          await onUpload(file);
          Toast.show({
            type: "success",
            text1: "Imagen actualizada",
          });
        } catch (error: any) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: error?.message,
          });
          setPreview(null);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo seleccionar la imagen",
      });
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setLoading(true);
    try {
      await onDelete();
      setPreview(null);
      Toast.show({
        type: "success",
        text1: "Imagen eliminada",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "No se pudo eliminar la imagen",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayImageUrl = preview || currentImageUrl;

  return (
    <View style={styles.container}>
      {Platform.OS === "web" && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleWebFileChange}
        />
      )}
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      {description && (
        <Text style={[styles.description, { color: c.textSecondary }]}>
          {description}
        </Text>
      )}

      <View style={[
        styles.imageContainer,
        {
          backgroundColor: c.card,
          borderColor: c.border
        }
      ]}>
        {displayImageUrl ? (
          <Image
            source={{ uri: displayImageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: c.background }]}>
            <Upload size={32} color={c.textSecondary} />
            <Text style={[styles.placeholderText, { color: c.textSecondary }]}>
              Sin imagen
            </Text>
          </View>
        )}

        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: c.card + 'E6' }]}>
            <ActivityIndicator size="large" color={c.primary} />
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={pickImage}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            styles.uploadButton,
            { backgroundColor: c.primary },
            pressed && styles.buttonPressed,
          ]}
        >
          <Upload size={16} color="#fff" />
          <Text style={styles.buttonText}>
            {currentImageUrl ? "Cambiar" : "Subir"}
          </Text>
        </Pressable>

        {currentImageUrl && onDelete && (
          <Pressable
            onPress={handleDelete}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              styles.deleteButton,
              { borderColor: c.border },
              pressed && styles.buttonPressed,
            ]}
          >
            <Trash2 size={16} color="#ef4444" />
            <Text style={[styles.deleteButtonText, { color: "#ef4444" }]}>
              Eliminar
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    marginBottom: 12,
  },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(128, 128, 128, 0.3)",
  },
  placeholderText: {
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  uploadButton: {},
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
