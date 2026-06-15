"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export function SessionManagement() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-card rounded-xl p-6">
      <h2 className="text-base font-semibold">Session</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        You are signed in with a secure HTTP-only session cookie
      </p>

      {user && (
        <div className="mt-6 rounded-lg border border-border bg-white px-4 py-3">
          <p className="text-sm font-medium">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            Role: {user.role ?? "user"} · Plan: {user.plan}
          </p>
        </div>
      )}

      <div className="mt-6">
        <Button variant="outline" size="sm" onClick={() => void logout()}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
