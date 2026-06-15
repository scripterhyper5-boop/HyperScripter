export const USER_AUTH_ROUTES = {
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
} as const;

export const ADMIN_AUTH_ROUTES = {
  login: "/admin/login",
  home: "/admin",
  dashboard: "/admin/dashboard",
} as const;

export const USER_PROTECTED_PREFIX = "/dashboard";
export const ADMIN_PREFIX = "/admin";
export const ADMIN_PUBLIC_PATHS = ["/admin/login"] as const;

export type UserAuthRoute = (typeof USER_AUTH_ROUTES)[keyof typeof USER_AUTH_ROUTES];
export type AdminAuthRoute = (typeof ADMIN_AUTH_ROUTES)[keyof typeof ADMIN_AUTH_ROUTES];
