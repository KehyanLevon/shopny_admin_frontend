import React from "react";
import { Tooltip, Typography } from "@mui/material";

interface Props {
  text?: string | null;
  max?: number;
  placeholder?: React.ReactNode;
}

export const TruncatedTextWithTooltip: React.FC<Props> = ({
  text,
  max = 15,
  placeholder = (
    <Typography variant="body2" color="text.secondary">
      —
    </Typography>
  ),
}) => {
  if (!text) return <>{placeholder}</>;

  const truncated =
    text.length > max ? text.slice(0, max).trimEnd() + "..." : text;

  return (
    <Tooltip title={text}>
      <span>{truncated}</span>
    </Tooltip>
  );
};
