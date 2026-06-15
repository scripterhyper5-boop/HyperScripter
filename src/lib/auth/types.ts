export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: UserRole;
  plan: "free" | "pro" | "team";
  createdAt: string;
}

export interface Session {
  user: User;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}
