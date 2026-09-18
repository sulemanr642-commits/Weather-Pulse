/**
 * Authentication and Authorization Types
 * Exactly synchronized with backend contracts:
 * - com.weatherpulse.web.dto.LoginRequest
 * - com.weatherpulse.web.dto.AuthResponse
 */

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  role: string;
}

export interface AdminAuthState {
  token: string;
  username: string;
  isAuthenticated: boolean;
}
