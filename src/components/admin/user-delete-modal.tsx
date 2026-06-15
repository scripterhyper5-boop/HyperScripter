"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AdminUserRow } from "@/lib/admin/types";

interface UserDeleteModalProps {
  user: AdminUserRow;
  onClose: () => void;
  onDeleted: () => void;
}

export function UserDeleteModal({ user, onClose, onDeleted }: UserDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText === user.email;

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to delete user");
      toast.success("User deleted");
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/20 p-4 sm:items-center">
      <div
        className="saas-card w-full max-w-md rounded-2xl p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-delete-title"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 id="user-delete-title" className="text-lg font-semibold text-red-600">
                Delete User
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            You are about to permanently delete{" "}
            <span className="font-medium text-foreground">{user.name}</span> (
            {user.email}).
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Subscriptions</li>
            <li>Scripts</li>
            <li>Usage records</li>
            <li>Workspace memberships</li>
            <li>Owned workspaces</li>
            <li>User account</li>
          </ul>
        </div>

        <div className="mt-5 space-y-2">
          <label htmlFor="delete-confirm" className="text-sm text-muted-foreground">
            Type <span className="font-mono text-foreground">{user.email}</span> to
            confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="flex h-11 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={user.email}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={!canDelete || deleting}
            onClick={() => void handleDelete()}
          >
            {deleting && <Loader2 className="animate-spin" />}
            Delete User
          </Button>
        </div>
      </div>
    </div>
  );
}
