"use client";

import { useState, useEffect } from "react";
import { 
    FilterLines,
    SearchLg,
    Download01,
    Plus,
    Building02,
    Mail01,
    Phone,
    Calendar,
    DotsVertical,
    User01
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Table } from "@/components/application/table/table";
import { cx } from "@/utils/cx";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { visitorService, Lead as ApiLead } from "@/services/visitor-service";

// Types
interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    source: "website" | "linkedin" | "referral" | "manual";
    status: "new" | "contacted" | "qualified" | "proposal" | "customer" | "lost";
    dateAdded: string;
    lastContacted?: string;
    notes?: string;
}

export default function LeadsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeads = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await visitorService.getLeads();
                const mappedLeads: Lead[] = data.map(l => ({
                            id: l._id,
                            name: l.name || "Unknown Lead",
                            email: l.email || "",
                            phone: l.phone || "",
                            company: l.company || "",
                            role: l.role || "",
                            source: (l.source as any) || "website",
                            status: ((l.status === "converted" ? "customer" : l.status) || "new") as any,
                            dateAdded: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
                            lastContacted: l.lastContacted ? new Date(l.lastContacted).toLocaleDateString() : undefined,
                            notes: l.notes
                        }));
                setLeads(mappedLeads);
            } catch (error) {
                console.error("Failed to fetch leads:", error);
                setError("Failed to load leads. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeads();
    }, []);

    const filteredLeads = leads.filter(lead => 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRowClick = (leadId: string) => {
        setSelectedLeadId(leadId);
        setIsInfoOpen(true);
    };

    const selectedLead = leads.find(l => l.id === selectedLeadId) || leads[0];

    const getStatusColor = (status: Lead['status']) => {
        switch (status) {
            case 'new': return 'blue';
            case 'contacted': return 'orange';
            case 'qualified': return 'indigo';
            case 'proposal': return 'purple';
            case 'customer': return 'success';
            case 'lost': return 'gray';
            default: return 'gray';
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and track your potential customers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button color="secondary" iconLeading={Download01}>Export</Button>
                    <Button color="primary" iconLeading={Plus}>Add Lead</Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search leads..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button color="tertiary" iconLeading={FilterLines}>Filters</Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">Loading leads...</div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-red-500 gap-2">
                        <span>{error}</span>
                        <Button color="secondary" onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                ) : (
                <Table aria-label="Leads table" onRowAction={(key) => handleRowClick(key as string)} selectionMode="single">
                    <Table.Header>
                        <Table.Head isRowHeader>Lead</Table.Head>
                        <Table.Head>Company</Table.Head>
                        <Table.Head>Status</Table.Head>
                        <Table.Head>Contact</Table.Head>
                        <Table.Head>Source</Table.Head>
                        <Table.Head>Date Added</Table.Head>
                        <Table.Head></Table.Head>
                    </Table.Header>
                    <Table.Body>
                        {filteredLeads.map((lead) => (
                            <Table.Row key={lead.id} id={lead.id} className="cursor-pointer">
                                <Table.Cell>
                                    <div className="flex items-center gap-3">
                                        <Avatar initials={(lead.name || "?").charAt(0)} size="md" className="bg-blue-100 text-blue-700" />
                                        <div>
                                            <div className="font-medium text-gray-900 text-sm">{lead.name}</div>
                                            <div className="text-xs text-gray-500">{lead.role}</div>
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex items-center gap-2 text-gray-900 font-medium text-sm">
                                        <Building02 className="size-4 text-gray-500" />
                                        {lead.company}
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color={getStatusColor(lead.status)} type="pill-color">
                                        {(lead.status || "new").charAt(0).toUpperCase() + (lead.status || "new").slice(1)}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                                            <Mail01 className="size-3.5" />
                                            {lead.email}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                                            <Phone className="size-3.5" />
                                            {lead.phone}
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color="gray" type="modern">
                                        {lead.source}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <Calendar className="size-3.5" />
                                        <span className="text-sm">{lead.dateAdded}</span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" color="tertiary" iconLeading={DotsVertical} />
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
                )}
            </div>

            {/* Slideout for Lead Info */}
            <SlideoutMenu isOpen={isInfoOpen} onOpenChange={setIsInfoOpen}>
                <SlideoutMenu.Content>
                    <SlideoutMenu.Header onClose={() => setIsInfoOpen(false)}>
                        <div className="flex items-center gap-2">
                            <User01 className="size-5 text-gray-500" />
                            <span className="font-semibold text-gray-900 uppercase">LEAD INFORMATION</span>
                        </div>
                    </SlideoutMenu.Header>
                    {selectedLead && (
                    <div className="space-y-8 pb-6">
                        {/* PERSONAL INFO Section */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 uppercase mb-4">PERSONAL INFO</h3>
                            <div className="space-y-4">
                                <InfoItem label="Name" value={selectedLead.name} />
                                <InfoItem label="Role" value={selectedLead.role} />
                                <InfoItem label="Email" value={selectedLead.email} isLink />
                                <InfoItem label="Phone" value={selectedLead.phone} />
                            </div>
                        </div>

                        {/* COMPANY INFO Section */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 uppercase mb-4">COMPANY INFO</h3>
                            <div className="space-y-4">
                                <InfoItem label="Company" value={selectedLead.company} />
                                <InfoItem label="Source" value={selectedLead.source} />
                                <InfoItem label="Status" value={(selectedLead.status || "new").charAt(0).toUpperCase() + (selectedLead.status || "new").slice(1)} />
                                <InfoItem label="Date Added" value={selectedLead.dateAdded} />
                                {selectedLead.lastContacted && <InfoItem label="Last Contacted" value={selectedLead.lastContacted} />}
                            </div>
                        </div>
                        
                        {/* NOTES Section */}
                        {selectedLead.notes && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 uppercase mb-4">NOTES</h3>
                                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                                    {selectedLead.notes}
                                </div>
                            </div>
                        )}
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
