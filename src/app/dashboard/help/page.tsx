import Link from "next/link";
import { HelpCircle, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const helpLinks = [
  { icon: MessageSquare, label: "Documentation", href: "#" },
  { icon: Mail, label: "Contact support", href: "#" },
  { icon: HelpCircle, label: "FAQ", href: "/#faq" },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Help Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get help with HyperScripter
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {helpLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="dashboard-card group flex items-center gap-3 rounded-xl p-4 transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/10 ring-1 ring-cyan/20 transition-transform group-hover:scale-105">
              <link.icon className="h-4 w-4 text-cyan" />
            </div>
            <span className="text-sm font-medium">{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="dashboard-card rounded-xl p-6">
        <h2 className="text-base font-semibold">Need more help?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Our team typically responds within 24 hours.
        </p>
        <Button variant="outline" className="mt-4" size="sm">
          Email support
        </Button>
      </div>
    </div>
  );
}
