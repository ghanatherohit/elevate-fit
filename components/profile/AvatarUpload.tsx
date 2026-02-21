"use client";

import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseStorage } from "@/lib/auth/firebase-client";

type AvatarUploadProps = {
  uid: string;
  onUploaded: (url: string) => void;
};

export default function AvatarUpload({ uid, onUploaded }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const storageRef = ref(firebaseStorage, `avatars/${uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onUploaded(url);
    } catch {
      setError("Upload failed. Check Firebase Storage setup.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-2">
      <label className="text-xs text-muted">Avatar upload</label>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            handleUpload(file);
          }
        }}
        className="text-xs text-muted"
      />
      {uploading ? (
        <div className="text-xs text-muted">Uploading...</div>
      ) : null}
      {error ? (
        <div className="text-xs text-accent">{error}</div>
      ) : null}
    </div>
  );
}


