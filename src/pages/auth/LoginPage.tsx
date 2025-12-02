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

  const emailTrimmed = email.trim();
  const passwordTrimmed = password;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isEmailValid = emailTrimmed.length > 0 && emailRegex.test(emailTrimmed);
  const isPasswordValid = passwordTrimmed.length >= 8;

  const submitting = localLoading || globalLoading;
  const isFormValid = isEmailValid && isPasswordValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError(
        "Please enter a valid email and a password of at least 8 characters."
      );
      return;
    }

    setLocalLoading(true);

    try {
      await login(emailTrimmed, passwordTrimmed);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof Error && err.message === "ACCESS_DENIED") {
        setError("You don't have access to the admin panel.");
      } else if (axios.isAxiosError(err)) {
        const data = err.response?.data as any;
        const msg =
          data?.error ?? data?.message ?? "Incorrect email or password.";
        setError(msg);
      } else {
        setError("Error logging in.");
      }
    } finally {
      setLocalLoading(false);
    }
  }

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
              error={emailTrimmed.length > 0 && !isEmailValid}
              helperText={
                emailTrimmed.length > 0 && !isEmailValid
                  ? "Enter a valid email address."
                  : " "
              }
            />

            <TextField
              margin="normal"
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordTrimmed.length > 0 && !isPasswordValid}
              helperText={
                passwordTrimmed.length > 0 && !isPasswordValid
                  ? "Password must be at least 8 characters."
                  : " "
              }
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              disabled={submitting || !isFormValid}
            >
              {submitting ? "Logging in..." : "Log in"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </AuthContainer>
  );
};
