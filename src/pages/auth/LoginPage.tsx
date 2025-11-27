import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { AuthContainer } from "../../components/auth/AuthContainer";

export const LoginPage: React.FC = () => {
  const login = useAuthStore((s) => s.login);
  const globalLoading = useAuthStore((s) => s.loading);

  const navigate = useNavigate();
  const location = useLocation() as any;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLocalLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof Error && err.message === "ACCESS_DENIED") {
        setError("You don't have access to the admin panel.");
      } else if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as any)?.error ??
          "Incorrect email or password.";
        setError(msg);
      } else {
        setError("Error logging in.");
      }
    } finally {
      setLocalLoading(false);
    }
  }

  const submitting = localLoading || globalLoading;

  return (
    <AuthContainer>
      <Card sx={{ width: 380, boxShadow: 6 }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom>
            Admin Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              margin="normal"
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              disabled={submitting}
            >
              {submitting ? "Logging in..." : "Log in"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </AuthContainer>
  );
};
