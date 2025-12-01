import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import React, { useRef, useState } from "react";

interface ProductImagesManagerProps {
  productId: number | null; // оставляем для совместимости, но внутри не используем
  images: string[];
  onChange: (updated: string[]) => void;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const buildImageUrl = (src: string) => {
  if (src.startsWith("data:")) {
    return src;
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  return `${API_BASE_URL}${src}`;
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

export const ProductImagesManager: React.FC<ProductImagesManagerProps> = ({
  images,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSelectFiles = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const dataUrls = await Promise.all(fileArray.map(fileToDataUrl));
      onChange([...images, ...dataUrls]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = (path: string) => {
    setDeleting(path);
    const updated = images.filter((img) => img !== path);
    onChange(updated);
    setDeleting(null);
  };

  return (
    <Box mt={3}>
      <Typography variant="h6" gutterBottom>
        Images
      </Typography>

      <Box mb={2}>
        <Button
          variant="outlined"
          startIcon={<AddPhotoAlternateIcon />}
          onClick={handleSelectFiles}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload images"}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleUpload}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 2,
        }}
      >
        {images.length === 0 && (
          <Typography color="text.secondary">No images uploaded yet</Typography>
        )}

        {images.map((img) => (
          <Box
            key={img}
            sx={{
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #ddd",
            }}
          >
            <img
              src={buildImageUrl(img)}
              alt=""
              style={{
                width: "100%",
                height: 120,
                objectFit: "cover",
                display: "block",
              }}
            />

            <Tooltip title="Delete image">
              <IconButton
                size="small"
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  background: "rgba(0,0,0,0.4)",
                  color: "white",
                  "&:hover": { background: "rgba(0,0,0,0.6)" },
                }}
                onClick={() => handleDelete(img)}
                disabled={deleting === img}
              >
                {deleting === img ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DeleteIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
