import { useEffect, useRef, useState } from "react";
import { TextField, type TextFieldProps } from "@mui/material";

export interface SearchInputProps
  extends Omit<TextFieldProps, "value" | "onChange"> {
  initialValue?: string;
  onSearchChange: (value: string) => void;
  delay?: number;
  maxLength?: number;
}

export function SearchInput({
  initialValue = "",
  onSearchChange,
  delay = 400,
  maxLength = 255,
  label = "Search",
  size = "small",
  ...textFieldProps
}: SearchInputProps) {
  const [value, setValue] = useState(initialValue);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(onSearchChange);

  useEffect(() => {
    callbackRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.slice(0, maxLength);
    setValue(next);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const trimmed = next.trim();
      callbackRef.current(trimmed);
    }, delay);
  };

  return (
    <TextField
      size={size}
      label={label}
      value={value}
      onChange={handleChange}
      inputProps={{ maxLength }}
      {...textFieldProps}
    />
  );
}
