"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
    HomeLine, 
    Users01,
    Activity,
    MessageChatSquare,
    HelpCircle,
    File02,
    Building02
} from "@untitledui/icons";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import type { NavItemType } from "@/components/application/app-navigation/config";
import { authService, type AdminUser } from "@/services/auth-service";

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
    { label: "Brands", href: "/admin/brands", icon: Building02 },
];

const footerItems: NavItemType[] = [];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [user, setUser] = useState<AdminUser | undefined>(undefined);
    
    // Check if the current route is the register page (no sidebar)
    const isRegisterRoute = pathname === "/admin/register";

    useEffect(() => {
        // Allow the admin register page without token (first admin setup)
        if (isRegisterRoute) {
            setAuthorized(true);
            return;
        }

        const token = authService.getToken();
        if (!token) {
            router.replace("/login");
            return;
        }
        
        setAuthorized(true);
        
        // Fetch user info
        authService.getMe()
            .then(data => setUser(data))
            .catch(err => {
                console.error("Failed to fetch user:", err);
                // If token is invalid/expired, redirect to login
                authService.logout();
                router.replace("/login");
            });
    }, [pathname, router, isRegisterRoute]);

    const handleLogout = () => {
        authService.logout();
        router.push("/login");
    };

    if (isRegisterRoute) {
        return <main className="flex-1 bg-secondary">{children}</main>;
    }

    return (
        authorized ? (
            <div className="flex min-h-dvh flex-col lg:flex-row">
                <SidebarNavigationSimple 
                    activeUrl={pathname} 
                    items={navigation} 
                    footerItems={footerItems}
                    user={user}
                    onLogout={handleLogout}
                />
                <main className="flex-1 bg-secondary">{children}</main>
            </div>
        ) : null
    );
}
