"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
    HomeLine, 
    LifeBuoy01, 
    Settings01, 
    Users01,
    Activity,
    MessageChatSquare,
    HelpCircle,
    File02,
    Code01
} from "@untitledui/icons";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import type { NavItemType } from "@/components/application/app-navigation/config";

const navigation: NavItemType[] = [
    { label: "Home", href: "/admin", icon: HomeLine },
    { label: "Live view", href: "/admin/live-view", icon: Activity },
    { label: "My chats", href: "/admin/chats", icon: MessageChatSquare },
    { 
        label: "Visitors", 
        href: "#", 
        icon: Users01,
        items: [
            { label: "All Visitors", href: "/admin/visitors/all" },
            { label: "Leads", href: "/admin/visitors/leads" },
        ]
    },
    { label: "FAQs", href: "/admin/faqs", icon: HelpCircle },
    { label: "Articles", href: "/admin/articles", icon: File02 },
    { label: "Integration", href: "/admin/integration", icon: Code01 },
];

const footerItems: NavItemType[] = [
    { label: "Support", href: "/admin/support", icon: LifeBuoy01 },
    { label: "Settings", href: "/admin/settings", icon: Settings01 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const isRegisterRoute = pathname === "/admin/register";

    useEffect(() => {
        if (isRegisterRoute) {
            setAuthorized(true);
            return;
        }
        const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
        if (!token) {
            router.replace("/login");
            return;
        }
        setAuthorized(true);
    }, [pathname, router]);

    if (isRegisterRoute) {
        return <main className="flex-1 bg-secondary">{children}</main>;
    }

    return authorized ? (
        <div className="flex min-h-dvh flex-col lg:flex-row">
            <SidebarNavigationSimple activeUrl={pathname} items={navigation} footerItems={footerItems} />
            <main className="flex-1 bg-secondary">{children}</main>
        </div>
    ) : null;
}
