"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptTeamInvitation } from "@/lib/api/team-client";

export default function AcceptInvitationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link");
      return;
    }

    async function accept() {
      try {
        await acceptTeamInvitation(token!);
        setStatus("success");
        setMessage("You've joined the workspace!");
        toast.success("Invitation accepted");
        setTimeout(() => router.push("/dashboard/team"), 1500);
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Failed to accept invitation");
      }
    }

    void accept();
  }, [token, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      {status === "loading" && (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-violet" />
          <p className="mt-4 text-sm text-muted-foreground">Accepting invitation...</p>
        </>
      )}
      {status === "success" && (
        <>
          <p className="text-lg font-semibold">{message}</p>
          <p className="mt-2 text-sm text-muted-foreground">Redirecting to workspace...</p>
        </>
      )}
      {status === "error" && (
        <>
          <p className="text-lg font-semibold text-red-600">{message}</p>
          <Button
            variant="violet-glow"
            className="mt-6"
            onClick={() => router.push("/dashboard/team")}
          >
            Go to Team Workspace
          </Button>
        </>
      )}
    </div>
  );
}
