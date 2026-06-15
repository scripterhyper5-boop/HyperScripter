"use client";

import { useEffect, useState } from "react";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AccountProfileResponse } from "@/lib/account/types";
import { cn } from "@/lib/utils";

interface ProfileSettingsFormProps {
  profileApiUrl: string;
  onSaved?: (profile: AccountProfileResponse) => void;
  variant?: "user" | "admin";
  initialProfile?: AccountProfileResponse | null;
}

export function ProfileSettingsForm({
  profileApiUrl,
  onSaved,
  variant = "user",
  initialProfile,
}: ProfileSettingsFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (initialProfile) {
        setName(initialProfile.name);
        setEmail(initialProfile.email);
        setAvatarUrl(initialProfile.avatarUrl ?? "");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(profileApiUrl);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load profile");
        if (!cancelled) {
          setName(data.profile.name);
          setEmail(data.profile.email);
          setAvatarUrl(data.profile.avatarUrl ?? "");
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [profileApiUrl, initialProfile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(profileApiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          avatarUrl: avatarUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save profile");
      toast.success("Profile updated successfully");
      onSaved?.(data.profile);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const isAdmin = variant === "admin";

  return (
    <Card
      className={cn(
        "border-border bg-white/80",
        isAdmin && "border-amber-500/10"
      )}
    >
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your {isAdmin ? "admin " : ""}account details and profile image
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading profile...
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div
                  className={cn(
                    "relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-[#0B0B0B]",
                    isAdmin ? "ring-amber-500/30" : "ring-violet/30"
                  )}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={() => setAvatarUrl("")}
                    />
                  ) : (
                    <UserRound className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="avatarUrl">Profile image URL (optional)</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a public image URL for your avatar
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{isAdmin ? "Admin full name" : "Full name"}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {isAdmin ? "Admin email address" : "Email address"}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="border-t border-border pt-6">
          <Button
            type="submit"
            variant={isAdmin ? "default" : "violet-glow"}
            className={cn(isAdmin && "bg-amber-600 hover:bg-amber-500")}
            disabled={loading || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
