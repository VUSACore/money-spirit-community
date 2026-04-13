import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  size?: number;
  onUploaded: (url: string) => void;
}

const AvatarUpload = ({ userId, currentUrl, size = 120, onUploaded }: AvatarUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${userId}/avatar.jpg`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();
    setPreview(url);
    onUploaded(url);
    setUploading(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative group"
        style={{
          width: size, height: size, borderRadius: "50%",
          background: preview ? `url(${preview}) center/cover` : "var(--ms-surface-2)",
          border: preview ? "3px solid var(--ms-base)" : "2px dashed #C9941E",
          overflow: "hidden",
        }}
      >
        {!preview && (
          <div className="flex flex-col items-center justify-center h-full">
            <Camera size={24} style={{ color: "var(--ms-text-muted)" }} />
          </div>
        )}
        {preview && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={20} style={{ color: "#fff" }} />
          </div>
        )}
      </button>
      <span className="text-xs font-body" style={{ color: "var(--ms-text-muted)" }}>
        {uploading ? "Uploading…" : "Upload photo"}
      </span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
};

export default AvatarUpload;
