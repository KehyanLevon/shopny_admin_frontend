import type { ReactNode } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Switch,
  Box,
  Alert,
} from "@mui/material";

type FieldName<F> = Extract<keyof F, string>;

type FieldType = "text" | "textarea" | "select" | "switch";

export interface FormFieldOption {
  value: number | string;
  label: string;
}

export interface FormFieldConfig<F> {
  name: FieldName<F>;
  label: string;
  type: FieldType;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  options?: FormFieldOption[];
  maxLength?: number;
  showCounter?: boolean;
}

interface EntityFormDialogProps<F> {
  open: boolean;
  mode: "create" | "edit";
  title: string;
  fields: FormFieldConfig<F>[];
  values: F;
  onChange: (values: F) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  isValid?: boolean;
  children?: ReactNode;
  errors?: Partial<Record<FieldName<F> | "global", string[]>>;
  onFieldBlur?: (name: FieldName<F>) => void;
}

export function EntityFormDialog<F extends Record<string, any>>({
  open,
  mode,
  title,
  fields,
  values,
  onChange,
  onClose,
  onSubmit,
  submitting = false,
  isValid = true,
  children,
  errors,
  onFieldBlur,
}: EntityFormDialogProps<F>) {
  const handleFieldChange = (name: FieldName<F>, value: any) => {
    onChange({
      ...values,
      [name]: value,
    });
  };

  const globalErrors = errors?.global;
  const globalErrorText = globalErrors?.join(" ") ?? "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>
        {mode === "create" ? `Create ${title}` : `Edit ${title}`}
      </DialogTitle>
      <DialogContent>
        {globalErrors && (
          <Box mt={1} mb={2}>
            <Alert severity="error">{globalErrorText}</Alert>
          </Box>
        )}

        {fields.map((field) => {
          const rawValue: any = values[field.name];
          const fieldErrors = errors?.[field.name];
          const fieldErrorText = fieldErrors?.join(" ") ?? "";
          const isTextLike = field.type === "text" || field.type === "textarea";
          const valueStr: string = isTextLike
            ? typeof rawValue === "string"
              ? rawValue
              : rawValue ?? ""
            : rawValue ?? "";

          const hasMax =
            typeof field.maxLength === "number" &&
            (field.type === "text" || field.type === "textarea");

          const currentLength = hasMax ? valueStr.length : 0;
          const isOverMax =
            hasMax && currentLength > (field.maxLength as number);

          if (field.type === "switch") {
            return (
              <Box key={field.name} mt={2}>
                <Stack direction="row" alignItems="center">
                  <Typography>{field.label}</Typography>
                  <Switch
                    sx={{ ml: 1 }}
                    checked={Boolean(rawValue)}
                    onChange={(e) =>
                      handleFieldChange(field.name, e.target.checked)
                    }
                    onBlur={() => onFieldBlur?.(field.name)}
                  />
                </Stack>
                <Box sx={{ minHeight: 18, mt: 0.5 }}>
                  {fieldErrors && (
                    <Typography variant="caption" color="error">
                      {fieldErrorText}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          }

          const showError = !!fieldErrors || isOverMax;

          const effectiveHelperText =
            fieldErrorText ||
            (isOverMax && hasMax
              ? `Maximum ${field.maxLength} characters. You exceeded by ${
                  currentLength - (field.maxLength as number)
                }.`
              : " ");

          if (field.type === "select") {
            return (
              <TextField
                key={field.name}
                margin="normal"
                label={field.label}
                fullWidth
                select
                required={field.required}
                value={rawValue ?? ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                onBlur={() => onFieldBlur?.(field.name)}
                error={showError}
                helperText={effectiveHelperText}
              >
                {field.options?.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            );
          }

          const textField = (
            <TextField
              key={field.name}
              margin="normal"
              label={field.label}
              fullWidth
              required={field.required}
              multiline={field.type === "textarea" || field.multiline}
              minRows={field.rows ?? (field.type === "textarea" ? 2 : 1)}
              value={valueStr}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => onFieldBlur?.(field.name)}
              error={showError}
              helperText={effectiveHelperText}
            />
          );

          return (
            <Box key={field.name}>
              {textField}

              {field.showCounter && hasMax && (
                <Box
                  display="flex"
                  justifyContent="flex-end"
                  sx={{ mt: 0.5, minHeight: 18 }}
                >
                  <Typography
                    variant="caption"
                    color={isOverMax ? "error" : "text.secondary"}
                  >
                    {Math.max((field.maxLength as number) - currentLength, 0)}{" "}
                    characters left
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}

        {children && <Box mt={3}>{children}</Box>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={submitting || !isValid}
        >
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
