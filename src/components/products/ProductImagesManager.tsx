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
import { productApi } from "../../api/productApi";

interface ProductImagesManagerProps {
  productId: number | null;
  images: string[];
  onChange: (updated: string[]) => void;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const buildImageUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};

export const ProductImagesManager: React.FC<ProductImagesManagerProps> = ({
  productId,
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
    if (!files || !productId) return;

    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("images[]", f));

    setUploading(true);
    try {
      const res = await productApi.uploadImages(productId, fd);
      onChange(res.data.images);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (path: string) => {
    if (!productId) return;
    setDeleting(path);

    try {
      const res = await productApi.deleteImage(productId, path);
      onChange(res.data.images);
    } finally {
      setDeleting(null);
    }
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
          disabled={!productId || uploading}
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
