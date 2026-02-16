"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/analytics", label: "Аналитика сети" },
    { href: "/analytics/me", label: "Аналитика меня" },
];

export function AnalyticsNavLinks({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <span className={cn("inline-flex max-w-full flex-wrap items-center justify-center gap-2", className)}>
            {navItems.map((item) => {
                const isActive =
                    pathname === item.href ||
                    (item.href === "/analytics" && pathname.startsWith("/analytics") && !pathname.startsWith("/analytics/me"));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "max-w-full rounded-lg border px-3 py-1.5 text-center text-sm leading-tight font-normal sm:px-4 sm:py-2 sm:text-base sm:leading-normal transition-colors",
                            isActive
                                ? "border-primary/40 bg-secondary text-foreground shadow-sm hover:bg-secondary/80"
                                : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </span>
    );
}
