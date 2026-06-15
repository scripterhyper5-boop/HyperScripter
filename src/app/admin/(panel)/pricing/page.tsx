"use client";

import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PLAN_LIST } from "@/lib/plans";
import { toast } from "sonner";

export default function AdminPricingPage() {
  const initialPlans = useMemo(
    () =>
      PLAN_LIST.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        monthlyLimit: plan.monthlyLimitLabel,
        features: [...plan.enabledFeatures],
      })),
    []
  );

  const [plans, setPlans] = useState(initialPlans);

  function updatePlan(
    id: string,
    field: "price" | "monthlyLimit",
    value: string | number
  ) {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function updateFeatures(id: string, features: string) {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, features: features.split("\n").filter(Boolean) } : p
      )
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Pricing" description="Manage subscription plans and limits">
        <Button
          variant="violet-glow"
          size="sm"
          onClick={() =>
            toast.message("Plan definitions are managed in code (src/lib/plans)")
          }
        >
          Save changes
        </Button>
      </AdminPageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="saas-card space-y-5 rounded-xl border border-border p-6"
          >
            <h2 className="text-lg font-semibold">{plan.name} Plan</h2>

            <div className="space-y-2">
              <Label htmlFor={`price-${plan.id}`}>Price ($/mo)</Label>
              <Input
                id={`price-${plan.id}`}
                type="number"
                value={plan.price}
                onChange={(e) => updatePlan(plan.id, "price", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`limit-${plan.id}`}>Monthly Limits</Label>
              <Input
                id={`limit-${plan.id}`}
                value={plan.monthlyLimit}
                onChange={(e) => updatePlan(plan.id, "monthlyLimit", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`features-${plan.id}`}>Features (one per line)</Label>
              <Textarea
                id={`features-${plan.id}`}
                rows={5}
                value={plan.features.join("\n")}
                onChange={(e) => updateFeatures(plan.id, e.target.value)}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
