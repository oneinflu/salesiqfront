"use client";

import { useState, useEffect, useRef } from "react";
import { socketService } from "@/services/socket-service";
import { 
    FilterLines, 
    LayoutAlt01, 
    Target01, 
    InfoCircle,
    Check,
    ArrowRight,
    ArrowLeft,
    Lightning01,
    MessageChatSquare,
    Target01 as ClickIcon,
    RefreshCw01,
    Stars02,
    File02,
    CurrencyDollar,
    Monitor01
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { ButtonGroup } from "@/components/base/button-group/button-group";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
import { cx } from "@/utils/cx";
import { Badge } from "@/components/base/badges/badges";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { ActiveSessionsTable } from "./components/active-sessions-table";
import { RingView, VisitorSession } from "./components/ring-view";

type ViewMode = "ring" | "list";
type FilterType = "time-spent" | "visits" | "actions" | "past-chats";
type Stage = "Repeated" | "Contacted" | "Responder" | "Potential" | "Triggered" | "Clicked" | "Chat" | "New Visitor";
type TabType = "hot" | "cold";

interface Visitor {
    id: string;
    sessionId?: string;
    name: string;
    avatarUrl?: string;
    countryCode: string; // e.g., "US", "IN"
    city?: string;
    region?: string;
    country?: string;
    timeAgo: string;
    score: number;
    currentPath: string;
    durationSeconds?: number;
    stage: Stage;
    visits: number; // for column grouping
    device?: string;
    browser?: string;
    os?: string;
    ip?: string;
    sessionStart?: Date;
    lastActive?: Date;
    hasActiveChat?: boolean;
}

// Icon mapping configuration
const STAGE_CONFIG: Record<Stage, { icon: any, color: string, label: string }> = {
    "Repeated": { icon: RefreshCw01, color: "text-purple-500 bg-purple-100", label: "Repeated" },
    "Contacted": { icon: ArrowRight, color: "text-orange-500 bg-orange-100", label: "Contacted" },
    "Responder": { icon: ArrowLeft, color: "text-blue-500 bg-blue-100", label: "Responder" },
    "Potential": { icon: CurrencyDollar, color: "text-green-500 bg-green-100", label: "Potential" },
    "Triggered": { icon: Lightning01, color: "text-red-500 bg-red-100", label: "Triggered" },
    "Clicked": { icon: ClickIcon, color: "text-cyan-500 bg-cyan-100", label: "Clicked" },
    "Chat": { icon: MessageChatSquare, color: "text-blue-600 bg-blue-100", label: "Chat" },
    "New Visitor": { icon: Stars02, color: "text-fuchsia-500 bg-fuchsia-100", label: "New Visitor" },
};

const MOCK_VISITORS: Visitor[] = [
    { id: "1", name: "Mina", countryCode: "US", timeAgo: "1min ago", score: 83, currentPath: "Zylker/Pricing", stage: "Triggered", visits: 1 },
    { id: "2", name: "Chandar", countryCode: "IN", timeAgo: "1min ago", score: 48, currentPath: "Zylker/support", stage: "Responder", visits: 1 },
    { id: "3", name: "Cidy", countryCode: "US", timeAgo: "2min ago", score: 63, currentPath: "Zylker/support", stage: "Responder", visits: 1 },
    { id: "4", name: "Hanna", countryCode: "GB", timeAgo: "2min ago", score: 95, currentPath: "Zylker/support", stage: "Potential", visits: 1 },
    { id: "5", name: "Chris", countryCode: "US", timeAgo: "2min ago", score: 71, currentPath: "Zylker/support", stage: "Potential", visits: 1 },
    { id: "6", name: "James", countryCode: "US", timeAgo: "2min ago", score: 81, currentPath: "Zylker/Pricing", stage: "Repeated", visits: 1 },
    
    { id: "7", name: "132412", countryCode: "US", timeAgo: "just now", score: 35, currentPath: "Zylker", stage: "Repeated", visits: 2 },
    { id: "8", name: "Raphael", countryCode: "AE", timeAgo: "just now", score: 88, currentPath: "Zylker", stage: "Responder", visits: 2 },
    { id: "9", name: "Kent", countryCode: "US", timeAgo: "just now", score: 12, currentPath: "Zylker", stage: "Repeated", visits: 2 },
    { id: "10", name: "321423", countryCode: "US", timeAgo: "just now", score: 86, currentPath: "Zylker", stage: "Triggered", visits: 2 },
    { id: "11", name: "134134", countryCode: "US", timeAgo: "just now", score: 83, currentPath: "Zylker", stage: "Repeated", visits: 2 },

    { id: "12", name: "412343", countryCode: "US", timeAgo: "just now", score: 1, currentPath: "Zylker/shop", stage: "Triggered", visits: 3 },
    { id: "13", name: "Emma", countryCode: "FR", timeAgo: "just now", score: 68, currentPath: "Zylker", stage: "Triggered", visits: 3 },
    { id: "14", name: "Linda", countryCode: "CA", timeAgo: "just now", score: 26, currentPath: "Zylker/shop", stage: "Triggered", visits: 3 },
    { id: "15", name: "Conor", countryCode: "US", timeAgo: "just now", score: 64, currentPath: "Zylker/shop", stage: "Triggered", visits: 3 },
    { id: "16", name: "Levi", countryCode: "JP", timeAgo: "just now", score: 1, currentPath: "Zylker/shop", stage: "Clicked", visits: 3 },

    { id: "17", name: "Driti", countryCode: "IN", timeAgo: "just now", score: 96, currentPath: "Zylker", stage: "Clicked", visits: 4 },
    { id: "18", name: "Taylor", countryCode: "US", timeAgo: "just now", score: 68, currentPath: "Zylker", stage: "Potential", visits: 4 },
    { id: "19", name: "Jisoo", countryCode: "KR", timeAgo: "just now", score: 26, currentPath: "Zylker", stage: "Chat", visits: 4 },
    { id: "20", name: "Ravi", countryCode: "IN", timeAgo: "just now", score: 10, currentPath: "Zylker", stage: "Triggered", visits: 4 },
];

interface RingConfig {
    id: number;
    label: string;
    criteria: string;
    color: string; // Tailwind class for text/stroke color
    strokeColor: string;
    radius: number;
}

const FILTER_CONFIGS: Record<FilterType, { label: string; rings: RingConfig[] }> = {
    "time-spent": {
        label: "Time Spent",
        rings: [
            { id: 1, label: "Ring 1", criteria: "Time on site > 5 min", color: "text-pink-500", strokeColor: "stroke-pink-500", radius: 100 },
            { id: 2, label: "Ring 2", criteria: "Time on site > 2 min", color: "text-orange-500", strokeColor: "stroke-orange-500", radius: 180 },
            { id: 3, label: "Ring 3", criteria: "Time on site > 1 min", color: "text-sky-500", strokeColor: "stroke-sky-500", radius: 260 },
            { id: 4, label: "Ring 4", criteria: "Time on site > 5 sec", color: "text-blue-500", strokeColor: "stroke-blue-500", radius: 340 },
        ]
    },
    "visits": {
        label: "Visits",
        rings: [
            { id: 1, label: "Ring 1", criteria: "Visits > 50", color: "text-pink-500", strokeColor: "stroke-pink-500", radius: 100 },
            { id: 2, label: "Ring 2", criteria: "Visits > 20", color: "text-orange-500", strokeColor: "stroke-orange-500", radius: 180 },
            { id: 3, label: "Ring 3", criteria: "Visits > 5", color: "text-sky-500", strokeColor: "stroke-sky-500", radius: 260 },
            { id: 4, label: "Ring 4", criteria: "Visits > 1", color: "text-blue-500", strokeColor: "stroke-blue-500", radius: 340 },
        ]
    },
    "actions": {
        label: "Actions",
        rings: [
            { id: 1, label: "Ring 1", criteria: "Actions > 20", color: "text-pink-500", strokeColor: "stroke-pink-500", radius: 100 },
            { id: 2, label: "Ring 2", criteria: "Actions > 10", color: "text-orange-500", strokeColor: "stroke-orange-500", radius: 180 },
            { id: 3, label: "Ring 3", criteria: "Actions > 5", color: "text-sky-500", strokeColor: "stroke-sky-500", radius: 260 },
            { id: 4, label: "Ring 4", criteria: "Actions > 1", color: "text-blue-500", strokeColor: "stroke-blue-500", radius: 340 },
        ]
    },
    "past-chats": {
        label: "Past Chats",
        rings: [
            { id: 1, label: "Ring 1", criteria: "Chats > 10", color: "text-pink-500", strokeColor: "stroke-pink-500", radius: 100 },
            { id: 2, label: "Ring 2", criteria: "Chats > 5", color: "text-orange-500", strokeColor: "stroke-orange-500", radius: 180 },
            { id: 3, label: "Ring 3", criteria: "Chats > 2", color: "text-sky-500", strokeColor: "stroke-sky-500", radius: 260 },
            { id: 4, label: "Ring 4", criteria: "Chats > 0", color: "text-blue-500", strokeColor: "stroke-blue-500", radius: 340 },
        ]
    }
};

const LiveViewPage = () => {
    const [viewMode, setViewMode] = useState<ViewMode>("ring");
    const [filterType, setFilterType] = useState<FilterType>("time-spent");
    const [selectedRing, setSelectedRing] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("hot");
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    
    // Slideout state
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    
    // Time state for dynamic updates
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);
    
    // Audio ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const currentConfig = FILTER_CONFIGS[filterType];

    const handleVisitorClick = (visitor: Visitor) => {
        setSelectedVisitor(visitor);
        setIsInfoOpen(true);
    };

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio('/tring.mp3');
        audioRef.current.loop = true;
        
        socketService.connect();

        const mapVisitor = (v: any): Visitor => {
            const visitorDetails = v.visitor || v; // Handle if wrapped in session object
            const location = visitorDetails.location || {};
            const device = visitorDetails.device || {};
            
            const hasActiveChat = v.hasActiveChat || false;

            // Determine stage dynamically
            let stage: Stage = 'New Visitor';
            if (hasActiveChat) {
                stage = 'Chat';
            } else if (visitorDetails.email || (visitorDetails.name && !visitorDetails.name.startsWith('Visitor') && !visitorDetails.name.match(/Visitor \d+/))) {
                stage = 'Contacted';
            } else if ((v.visits || visitorDetails.visits || 1) > 1) {
                stage = 'Repeated';
            }

            return {
                id: visitorDetails._id,
                sessionId: v.sessionId,
                name: visitorDetails.name || `Visitor ${visitorDetails._id?.substr(-4) || 'Unknown'}`,
                countryCode: location.country || 'US',
                country: location.country,
                city: location.city,
                region: location.region,
                timeAgo: 'Just now', // Can use date-fns distanceToNow
                score: Math.floor(Math.random() * 100), // Mock score for now
                currentPath: v.pageUrl || visitorDetails.currentPage || '/',
                stage: stage,
                visits: v.visits || 1,
                device: device.type || v.device,
                browser: device.browser || v.browser,
                os: device.os || v.os,
                ip: visitorDetails.ip || v.ipAddress,
                sessionStart: v.sessionStart ? new Date(v.sessionStart) : undefined,
                lastActive: v.lastActiveAt ? new Date(v.lastActiveAt) : undefined,
                hasActiveChat: hasActiveChat,
                durationSeconds: v.durationSeconds
            };
        };

        socketService.on('active-visitors', (data: any[]) => {
            console.log('Received active visitors:', data);
            setVisitors(prev => {
                const mapped = data.map(mapVisitor);
                return mapped;
            });
        });

        socketService.on('visitor-updated', (v: any) => {
            console.log('Visitor updated:', v);
            setVisitors(prev => {
                const idx = prev.findIndex(pv => pv.id === v._id);
                const currentVisitor = idx >= 0 ? prev[idx] : null;
                
                // Preserve hasActiveChat if not present in update
                // The update from backend usually doesn't have hasActiveChat unless it's the full list
                const hasActiveChat = v.hasActiveChat !== undefined 
                    ? v.hasActiveChat 
                    : (currentVisitor?.hasActiveChat || false);

                // Create a merged object to pass to mapVisitor so stage is calculated correctly
                const vMerged = { ...v, hasActiveChat };
                const mapped = mapVisitor(vMerged);
                
                if (idx >= 0) {
                    const newVisitors = [...prev];
                    newVisitors[idx] = { ...newVisitors[idx], ...mapped };
                    return newVisitors;
                }
                // New visitor found via update event
                return [...prev, mapped];
            });
        });

        socketService.on('session-updated', (session: any) => {
            setVisitors(prev => {
                return prev.map(v => {
                    if (v.sessionId === session.sessionId || v.id === session.visitorId) {
                        return {
                            ...v,
                            lastActive: session.lastActiveAt ? new Date(session.lastActiveAt) : v.lastActive,
                            currentPath: session.pageUrl || v.currentPath,
                            durationSeconds: session.durationSeconds
                        };
                    }
                    return v;
                });
            });
        });

        socketService.on('new-message', (msg: any) => {
            // Update for ANY message (agent or visitor) to indicate active chat
            setVisitors(prev => prev.map(v => 
                v.id === msg.visitorId 
                    ? { ...v, hasActiveChat: true, stage: 'Chat' } 
                    : v
            ));
        });

        return () => {
            socketService.disconnect();
        };
    }, []);

    // Audio Loop Effect
    useEffect(() => {
        // Filter for visitors who are online (implied by visitors list) and NOT chatting
        const unattendedVisitors = visitors.filter(v => !v.hasActiveChat);
        const shouldRing = unattendedVisitors.length > 0;

        if (shouldRing) {
            if (audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(e => console.error("Audio play failed", e));
            }
        } else {
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
        
        // Cleanup on unmount or when visitors change (though visitors change often, we only want to stop on unmount if we leave page)
        // Actually, this effect runs on every visitors change. 
        // We should add a separate cleanup for unmount specifically.
    }, [visitors]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    return (
        <div className="relative flex h-[calc(100vh-64px)] w-full flex-col bg-white overflow-hidden">
            {/* Top Right Controls */}
            <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-6">
                <div className="flex items-center gap-3">
                    <ButtonGroup>
                        <Button 
                            size="sm" 
                            color={viewMode === "ring" ? "primary" : "secondary"}
                            onClick={() => setViewMode("ring")}
                            aria-label="Ring View"
                        >
                            <Target01 className="size-4" />
                        </Button>
                        <Button 
                            size="sm" 
                            color={viewMode === "list" ? "primary" : "secondary"}
                            onClick={() => setViewMode("list")}
                            aria-label="List View"
                        >
                            <LayoutAlt01 className="size-4" />
                        </Button>
                    </ButtonGroup>

                    <Dropdown.Root>
                        <Button color="secondary" size="sm">
                            <FilterLines className="mr-2 size-4" />
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu>
                                {(Object.keys(FILTER_CONFIGS) as FilterType[]).map((key) => (
                                    <Dropdown.Item 
                                        key={key} 
                                        onAction={() => setFilterType(key)}
                                        icon={filterType === key ? Check : undefined}
                                    >
                                        {FILTER_CONFIGS[key].label}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>
                </div>

                <div className="text-right space-y-1">
                    <p className="text-sm font-medium text-tertiary">
                        {visitors.length} visitors online
                    </p>
                    <p className="text-xs text-quaternary">
                        Visitors prioritized by: <span className="font-medium text-brand-600">{currentConfig.label}</span>
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex size-full items-center justify-center">
                {viewMode === "ring" ? (
                    <RingView 
                        sessions={visitors.map(v => ({
                            sessionId: v.sessionId || v.id,
                            durationSeconds: v.durationSeconds ?? (v.sessionStart ? Math.floor((now.getTime() - new Date(v.sessionStart).getTime()) / 1000) : 0),
                            country: v.countryCode || 'US',
                            avatarUrl: v.avatarUrl,
                            name: v.name,
                            currentPath: v.currentPath
                        }))}
                    />
                ) : (
                    <div className="w-full h-full p-6 overflow-auto bg-gray-50/50">
                        <ActiveSessionsTable visitors={visitors} now={now} />
                    </div>
                )}
            </div>
            
            {/* Legend / Explanation for Ring View */}
            {viewMode === "ring" && selectedRing && (
                <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-4 z-30">
                    <div className="flex w-80 flex-col gap-2 rounded-xl border border-secondary bg-primary p-4 shadow-lg ring-1 ring-black/5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-tertiary">Criteria</span>
                            <InfoCircle className="size-4 text-tertiary" />
                        </div>
                        <p className="text-sm font-medium text-primary">
                            {currentConfig.rings.find(r => r.id === selectedRing)?.criteria}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                             <Badge color={
                                 selectedRing === 1 ? "pink" : 
                                 selectedRing === 2 ? "orange" : 
                                 selectedRing === 3 ? "blue-light" : "blue"
                             }>
                                 Ring {selectedRing}
                             </Badge>
                        </div>
                    </div>
                </div>
            )}
            {/* Slideout for Visitor Info */}
            <SlideoutMenu isOpen={isInfoOpen} onOpenChange={setIsInfoOpen}>
                <SlideoutMenu.Content>
                    <SlideoutMenu.Header onClose={() => setIsInfoOpen(false)}>
                        <div className="flex items-center gap-2">
                            <Monitor01 className="size-5 text-gray-500" />
                            <span className="font-semibold text-gray-900 uppercase">VISITOR INFORMATION</span>
                        </div>
                    </SlideoutMenu.Header>
                    {selectedVisitor && (
                    <div className="space-y-8 pb-6">
                        {/* INFO Section */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 uppercase mb-4">INFO</h3>
                            <div className="space-y-4">
                                <InfoItem label="Name" value={selectedVisitor.name} />
                                <InfoItem label="Score" value={selectedVisitor.score + "%"} />
                                <InfoItem label="Status" value={selectedVisitor.stage} />
                                <InfoItem label="Current Page" value={selectedVisitor.currentPath} isLink />
                                <InfoItem label="Time on Site" value={selectedVisitor.timeAgo} />
                                <InfoItem label="Visits" value={selectedVisitor.visits} />
                                <InfoItem label="Last Active" value={selectedVisitor.lastActive ? selectedVisitor.lastActive.toLocaleTimeString() : 'Unknown'} />
                                <InfoItem label="Browser" value={selectedVisitor.browser || 'Unknown'} />
                                <InfoItem label="OS" value={selectedVisitor.os || 'Unknown'} />
                                <InfoItem label="Device" value={selectedVisitor.device || 'Unknown'} />
                                <InfoItem label="IP Address" value={selectedVisitor.ip || 'Unknown'} />
                            </div>
                        </div>

                        {/* VISITOR LOCATION Section */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 uppercase mb-4">VISITOR LOCATION</h3>
                            <div className="space-y-4">
                                <InfoItem label="City" value={selectedVisitor.city || 'Unknown'} />
                                <InfoItem label="Region" value={selectedVisitor.region || 'Unknown'} />
                                <InfoItem label="Country" value={selectedVisitor.country || 'Unknown'} />
                                <InfoItem label="Country Code" value={selectedVisitor.countryCode} />
                            </div>
                        </div>
                    </div>
                    )}
                </SlideoutMenu.Content>
            </SlideoutMenu>
        </div>
    );
};

const RingVisualization = ({ 
    config, 
    selectedRing, 
    onRingSelect,
    visitors,
    onVisitorClick,
    now
}: { 
    config: { label: string; rings: RingConfig[] }; 
    selectedRing: number | null; 
    onRingSelect: (id: number) => void; 
    visitors: Visitor[];
    onVisitorClick: (visitor: Visitor) => void;
    now: Date;
}) => {
    // Center point for 800x800 viewBox
    const cx = 400;
    const cy = 400;

    return (
        <div className="relative flex size-full items-center justify-center">
            <svg 
                viewBox="0 0 800 800" 
                className="size-full max-h-[80vh] max-w-[80vh] overflow-visible"
            >
                {/* Render Rings */}
                {[...config.rings].reverse().map((ring) => {
                    const isSelected = selectedRing === ring.id;
                    
                    return (
                        <g 
                            key={ring.id} 
                            onClick={() => onRingSelect(ring.id)}
                            className="group cursor-pointer"
                        >
                            {/* The Circle */}
                            <circle
                                cx={cx}
                                cy={cy}
                                r={ring.radius}
                                fill="transparent"
                                className={`
                                    ${ring.strokeColor} 
                                    fill-transparent
                                    stroke-[0.5px] transition-all duration-300
                                    group-hover:stroke-[1.5px] group-hover:opacity-100
                                    ${isSelected ? "stroke-[2px] opacity-100" : "opacity-80"}
                                `}
                            />
                            
                            {/* Hover/Selection Highlight Area (invisible wider stroke for easier clicking) */}
                            <circle
                                cx={cx}
                                cy={cy}
                                r={ring.radius}
                                stroke="transparent"
                                strokeWidth="30"
                                fill="transparent"
                            />
                        </g>
                    );
                })}

                {/* Render Visitors */}
                {visitors.map((visitor) => {
                    let radius = 340;
                    
                    // Determine radius based on config
                    if (config.label === "Time Spent" && visitor.sessionStart) {
                        const seconds = (now.getTime() - new Date(visitor.sessionStart).getTime()) / 1000;
                        // Interpolate radius based on new thresholds:
                        // < 5s: approaching outer ring (345 -> 340)
                        // 5s - 60s (1m): Ring 4 -> Ring 3 (340 -> 260)
                        // 60s - 120s (2m): Ring 3 -> Ring 2 (260 -> 180)
                        // 120s - 300s (5m): Ring 2 -> Ring 1 (180 -> 100)
                        // > 300s: Ring 1 -> Center (100 -> 60)
                        
                        if (seconds < 5) {
                             radius = 345 - (seconds / 5) * (345 - 340);
                        } else if (seconds < 60) {
                             radius = 340 - ((seconds - 5) / 55) * (340 - 260);
                        } else if (seconds < 120) {
                             radius = 260 - ((seconds - 60) / 60) * (260 - 180);
                        } else if (seconds < 300) {
                             radius = 180 - ((seconds - 120) / 180) * (180 - 100);
                        } else {
                             // Slower approach to center after 5 mins
                             radius = Math.max(60, 100 - ((seconds - 300) / 300) * 40);
                        }
                    } else {
                        // Discrete logic for other filters
                        let assignedRingId = 4;
                        if (config.label === "Visits") {
                            const visits = visitor.visits || 1;
                            if (visits > 50) assignedRingId = 1;
                            else if (visits > 20) assignedRingId = 2;
                            else if (visits > 5) assignedRingId = 3;
                            else assignedRingId = 4;
                        } else {
                            // Fallback to hash for other filters
                            const hash = visitor.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                            assignedRingId = (hash % 4) + 1;
                        }
                        const ring = config.rings.find(r => r.id === assignedRingId);
                        radius = ring ? ring.radius : 340;
                    }

                    // Calculate position
                    // Use deterministic angle based on ID
                    const hash = visitor.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const angle = (hash % 360) * (Math.PI / 180); 
                    
                    const vx = cx + radius * Math.cos(angle);
                    const vy = cy + radius * Math.sin(angle);

                    return (
                        <foreignObject 
                            key={visitor.id}
                            x={vx - 16} 
                            y={vy - 16} 
                            width="32" 
                            height="32"
                            className="overflow-visible pointer-events-none transition-all duration-1000 ease-linear" 
                        >
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onVisitorClick(visitor);
                                }}
                                className="flex items-center justify-center w-full h-full transition-transform hover:scale-125 pointer-events-auto cursor-pointer" 
                                title={`Name: ${visitor.name}
City: ${visitor.city || 'Unknown'}
Region: ${visitor.region || 'Unknown'}
Country: ${visitor.country || 'Unknown'}
Device: ${visitor.device || 'Unknown'} (${visitor.os || 'Unknown'})
Browser: ${visitor.browser || 'Unknown'}
IP: ${visitor.ip || 'Unknown'}
Came: ${visitor.sessionStart ? new Date(visitor.sessionStart).toLocaleTimeString() : 'Unknown'}
Status: ${visitor.stage}
Path: ${visitor.currentPath}`}
                            >
                                <Avatar 
                                    initials={visitor.countryCode} 
                                    alt={visitor.name}
                                    size="sm"
                                    className="shadow-sm border-2 border-white"
                                />
                            </div>
                        </foreignObject>
                    );
                })}

                {/* Center Hub */}
                <foreignObject x={cx - 40} y={cy - 40} width="80" height="80">
                    <div className="flex size-full items-center justify-center rounded-full bg-orange-200/50">
                        <div className="flex size-14 items-center justify-center rounded-full bg-orange-400 shadow-sm">
                             <UntitledLogoMinimal className="size-8 text-white" />
                        </div>
                    </div>
                </foreignObject>
            </svg>
            
        </div>
    );
};

const ListView = ({ activeTab }: { activeTab: TabType }) => {
    const columns = [1, 2, 3, 4];
    const filteredVisitors = MOCK_VISITORS.filter(v => 
        activeTab === "hot" ? v.score >= 50 : v.score < 50
    );
    
    return (
        <div className="flex h-full w-full gap-4 overflow-x-auto pb-4">
            {columns.map(visitCount => (
                <KanbanColumn 
                    key={visitCount} 
                    title={`Number of visits is ${visitCount}`} 
                    count={filteredVisitors.filter(v => v.visits === visitCount).length}
                    visitors={filteredVisitors.filter(v => v.visits === visitCount)}
                />
            ))}
        </div>
    );
};

const KanbanColumn = ({ title, count, visitors }: { title: string, count: number, visitors: Visitor[] }) => (
    <div className="flex min-w-[300px] max-w-[300px] flex-col rounded-lg bg-gray-50/50">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-white rounded-t-lg">
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <span className="text-sm font-medium text-gray-500">{count}</span>
        </div>
        <div className="flex flex-col gap-3 p-3">
            {visitors.map(visitor => <VisitorCard key={visitor.id} visitor={visitor} />)}
        </div>
    </div>
);

const VisitorCard = ({ visitor }: { visitor: Visitor }) => {
    const stageConfig = STAGE_CONFIG[visitor.stage];
    const StageIcon = stageConfig.icon;
    
    return (
        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-brand-300">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Avatar 
                        initials={visitor.countryCode} 
                        alt={visitor.name} 
                        size="md" 
                        className="bg-gray-100 text-gray-600 font-medium text-xs"
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            {/* Flag placeholder using emoji for now */}
                            <span className="font-semibold text-gray-900 text-sm">{visitor.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            {/* Simple circular progress indicator mock */}
                            <div className="relative size-3.5">
                                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                    <path className="text-brand-500" strokeDasharray={`${visitor.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                </svg>
                            </div>
                            <span>{visitor.score}%</span>
                        </div>
                    </div>
                </div>
                <span className="text-xs text-gray-400 font-medium">{visitor.timeAgo}</span>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <File02 className="size-3.5 text-gray-400" />
                    <span className="truncate max-w-[140px]">{visitor.currentPath}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Tooltip title={stageConfig.label}>
                        <div className={`flex size-6 items-center justify-center rounded-full ${stageConfig.color} transition-colors`}>
                            <StageIcon className="size-3.5" />
                        </div>
                    </Tooltip>
                    {/* Placeholder for sharing/source icon */}
                    <div className="size-6 flex items-center justify-center rounded-full bg-gray-50 text-gray-400">
                        <ArrowRight className="size-3.5" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveViewPage;

// Helper Components
const InfoItem = ({ label, value, isLink, className }: { label: string, value: string | number, isLink?: boolean, className?: string }) => (
    <div className="flex justify-between items-start">
        <span className="text-sm text-gray-500 w-1/3 shrink-0">{label}</span>
        <div className={cx("text-sm text-gray-900 w-2/3 break-words", isLink ? "text-blue-600 hover:underline cursor-pointer" : "", className)}>
            {value}
        </div>
    </div>
);