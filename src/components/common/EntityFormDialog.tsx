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
}: EntityFormDialogProps<F>) {
  const handleFieldChange = (name: FieldName<F>, value: any) => {
    onChange({
      ...values,
      [name]: value,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>
        {mode === "create" ? `Create ${title}` : `Edit ${title}`}
      </DialogTitle>
      <DialogContent>
        {fields.map((field) => {
          const value = values[field.name];

          if (field.type === "switch") {
            return (
              <Stack
                key={field.name}
                direction="row"
                alignItems="center"
                mt={2}
              >
                <Typography>{field.label}</Typography>
                <Switch
                  sx={{ ml: 1 }}
                  checked={Boolean(value)}
                  onChange={(e) =>
                    handleFieldChange(field.name, e.target.checked)
                  }
                />
              </Stack>
            );
          }

          if (field.type === "select") {
            return (
              <TextField
                key={field.name}
                margin="normal"
                label={field.label}
                fullWidth
                select
                required={field.required}
                value={value ?? ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
              >
                {field.options?.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            );
          }

          return (
            <TextField
              key={field.name}
              margin="normal"
              label={field.label}
              fullWidth
              required={field.required}
              multiline={field.type === "textarea" || field.multiline}
              minRows={field.rows ?? (field.type === "textarea" ? 2 : 1)}
              value={value ?? ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
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
