"use client";


import { useState, useEffect } from "react";
import { socketService } from "@/services/socket-service";
import { 
    Monitor01, 
    MessageChatSquare,
    Clock,
    Globe01,
    DotsVertical,
    FilterLines,
    SearchLg,
    Download01,
    User01,
    ArrowRight
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Table } from "@/components/application/table/table";
import { Google } from "@/components/foundations/social-icons";
import { cx } from "@/utils/cx";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { visitorService } from "@/services/visitor-service";

// Types
interface VisitorLocation {
    city: string;
    state: string;
    country: string;
    countryCode: string;
}

interface Visitor {
    id: string;
    name: string;
    email?: string;
    status: "online" | "idle" | "offline";
    source: "direct" | "google" | "social" | "referral";
    currentPage: string;
    timeOnSite: string;
    location: VisitorLocation;
    browser: string;
    os: string;
    device: "desktop" | "mobile" | "tablet";
    visits: number;
    lastVisit: string;
}

export default function VisitorsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const safeString = (val: any, fallback = ""): string => {
            if (typeof val === 'string') return val;
            if (typeof val === 'number') return String(val);
            return fallback;
        };

        const mapVisitor = (v: any): Visitor => ({
            id: v._id,
            name: v.name || `Visitor ${v._id.substring(0, 6)}`,
            email: v.email,
            status: (v.status as "online" | "idle" | "offline") || "online",
            source: (v.source as "direct" | "google" | "social" | "referral") || "direct",
            currentPage: v.pageViews && v.pageViews.length > 0 ? v.pageViews[v.pageViews.length - 1].path : (v.currentPage || "/"),
            timeOnSite: v.sessionStart ? calculateTimeOnSite(v.sessionStart) : "Just now",
            location: {
                city: safeString(v.location?.city || v.city, "Unknown"),
                state: safeString(v.location?.region || v.region, ""),
                country: safeString(v.location?.country || v.country, "Unknown"),
                countryCode: safeString(v.location?.countryCode || v.countryCode || v.location?.country || v.country, "US")
            },
            browser: safeString(v.browser || (v.device && v.device.browser), "Unknown"),
            os: safeString(v.os || (v.device && v.device.os), "Unknown"),
            device: (v.device && typeof v.device === 'object' ? safeString(v.device.type, "desktop") : safeString(v.device, "desktop")) as "desktop" | "mobile" | "tablet",
            visits: v.pageViews ? v.pageViews.length : (typeof v.visits === 'number' ? v.visits : 1),
            lastVisit: v.lastSeen ? new Date(v.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"
        });

        const fetchVisitors = async () => {
            setIsLoading(true);
            try {
                const data = await visitorService.getVisitors();
                setVisitors(data.map(mapVisitor));
            } catch (error) {
                console.error("Failed to fetch visitors:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVisitors();
        
        // Connect to socket and listen for real-time updates
        socketService.connect();

        socketService.on('active-visitors', (data: any[]) => {
            // console.log('VisitorsPage: Received active visitors:', data);
            const activeVisitors = data.map(mapVisitor);
            
            setVisitors(prev => {
                // Create a map of existing visitors
                const visitorMap = new Map(prev.map(v => [v.id, v]));
                
                // Update or add active visitors
                activeVisitors.forEach(v => {
                    visitorMap.set(v.id, v);
                });
                
                // Convert back to array
                return Array.from(visitorMap.values());
            });
        });

        socketService.on('visitor-updated', (v: any) => {
            // console.log('VisitorsPage: Visitor updated:', v);
            setVisitors(prev => {
                const idx = prev.findIndex(pv => pv.id === v._id);
                const mapped = mapVisitor(v);
                if (idx >= 0) {
                    const newVisitors = [...prev];
                    newVisitors[idx] = { ...newVisitors[idx], ...mapped };
                    return newVisitors;
                }
                return [mapped, ...prev];
            });
        });
        
        return () => {
            socketService.disconnect();
        };
    }, []);

    const calculateTimeOnSite = (startTime: string | Date) => {
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 60000); // minutes
        if (diff < 1) return "Just now";
        return `${diff}m ago`;
    };

    const filteredVisitors = visitors.filter(visitor => 
        visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.location.country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRowClick = (visitorId: string) => {
        setSelectedVisitorId(visitorId);
        setIsInfoOpen(true);
    };

    const selectedVisitor = visitors.find(v => v.id === selectedVisitorId) || visitors[0];

    return (
        <div className="flex flex-col h-full bg-gray-50 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">All Visitors</h1>
                    <p className="text-gray-500 text-sm mt-1">Monitor real-time visitor activity and engagement.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button color="secondary" iconLeading={Download01}>Export</Button>
                    <Button color="primary" iconLeading={MessageChatSquare}>Chat with all</Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search visitors..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button color="tertiary" iconLeading={FilterLines}>Filters</Button>
                    <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
                    <span className="text-sm text-gray-500 hidden sm:block">{filteredVisitors.length} visitors online</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">Loading visitors...</div>
                ) : (
                <Table aria-label="Visitors table" onRowAction={(key) => handleRowClick(key as string)} selectionMode="single">
                    <Table.Header>
                        <Table.Head isRowHeader>Visitor</Table.Head>
                        <Table.Head>Status</Table.Head>
                        <Table.Head>Current Page</Table.Head>
                        <Table.Head>Source</Table.Head>
                        <Table.Head>Location</Table.Head>
                        <Table.Head>Time</Table.Head>
                        <Table.Head>Device</Table.Head>
                        <Table.Head></Table.Head>
                    </Table.Header>
                    <Table.Body>
                        {filteredVisitors.map((visitor) => (
                            <Table.Row key={visitor.id} id={visitor.id} className="cursor-pointer">
                                <Table.Cell>
                                    <div className="flex items-center gap-3">
                                        <Avatar 
                                            initials={visitor.name.charAt(0)} 
                                            size="md" 
                                            className={cx(
                                                "text-xs",
                                                visitor.status === "online" ? "bg-green-100 text-green-700" :
                                                visitor.status === "idle" ? "bg-orange-100 text-orange-700" :
                                                "bg-gray-100 text-gray-600"
                                            )} 
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900 text-sm">{visitor.name}</div>
                                            <div className="text-xs text-gray-500">{visitor.visits} visits • {visitor.lastVisit}</div>
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge 
                                        size="sm" 
                                        color={
                                            visitor.status === "online" ? "success" :
                                            visitor.status === "idle" ? "warning" :
                                            "gray"
                                        }
                                        type="pill-color"
                                    >
                                        {visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="max-w-[200px] truncate text-blue-600 hover:underline cursor-pointer text-sm">
                                        {visitor.currentPage}
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        {visitor.source === "google" && <Google className="size-4" />}
                                        {visitor.source === "direct" && <ArrowRight className="size-4" />}
                                        {visitor.source === "social" && <Globe01 className="size-4" />}
                                        {visitor.source === "referral" && <User01 className="size-4" />}
                                        <span className="capitalize text-sm">{visitor.source}</span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getFlagEmoji(visitor.location.countryCode)}</span>
                                        <span className="text-sm text-gray-700">{visitor.location.city}, {visitor.location.countryCode}</span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <Clock className="size-3.5" />
                                        <span className="text-sm">{visitor.timeOnSite}</span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Monitor01 className="size-4" />
                                        <span>{visitor.browser}</span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" color="primary" className="text-xs">Chat</Button>
                                        <Button size="sm" color="tertiary" iconLeading={DotsVertical} />
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
                )}
            </div>

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
                                {selectedVisitor.email && <InfoItem label="Email" value={selectedVisitor.email} />}
                                <InfoItem label="Status" value={selectedVisitor.status} />
                                <InfoItem label="Source" value={selectedVisitor.source} />
                                <InfoItem label="Current Page" value={selectedVisitor.currentPage} isLink />
                                <InfoItem label="Time on Site" value={selectedVisitor.timeOnSite} />
                                <InfoItem label="Visits" value={selectedVisitor.visits} />
                                <InfoItem label="Last Visit" value={selectedVisitor.lastVisit} />
                                <InfoItem label="Browser" value={selectedVisitor.browser} />
                                <InfoItem label="OS" value={selectedVisitor.os} />
                                <InfoItem label="Device" value={selectedVisitor.device} />
                            </div>
                        </div>

                        {/* VISITOR LOCATION Section */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 uppercase mb-4">VISITOR LOCATION</h3>
                            <div className="space-y-4">
                                <InfoItem label="City" value={selectedVisitor.location.city} />
                                <InfoItem label="State" value={selectedVisitor.location.state} />
                                <InfoItem label="Country" value={selectedVisitor.location.country} />
                                <InfoItem label="Country Code" value={selectedVisitor.location.countryCode} />
                            </div>
                        </div>
                    </div>
                    )}
                </SlideoutMenu.Content>
            </SlideoutMenu>
        </div>
    );
}

// Helper Components
const InfoItem = ({ label, value, isLink, className }: { label: string, value: string | number, isLink?: boolean, className?: string }) => (
    <div className="flex justify-between items-start">
        <span className="text-sm text-gray-500 w-1/3 shrink-0">{label}</span>
        <div className={cx("text-sm text-gray-900 w-2/3 break-words", isLink ? "text-blue-600 hover:underline cursor-pointer" : "", className)}>
            {value}
        </div>
    </div>
);

// Helper to get flag emoji from country code
function getFlagEmoji(countryCode: string) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char =>  127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
