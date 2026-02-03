import { useEffect, useState } from "react";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { companyService, CompanyDetails } from "@/services/company-service";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Copy01, Check, Globe02, Building02, Mail01, Clock, Palette } from "@untitledui/icons";
import { Label } from "@/components/base/input/label";

interface BrandDetailsSlideoverProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string | null;
}

export function BrandDetailsSlideover({ isOpen, onClose, companyId }: BrandDetailsSlideoverProps) {
    const [company, setCompany] = useState<CompanyDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedEmbedIds, setCopiedEmbedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchCompanyDetails = async () => {
            if (!companyId || !isOpen) return;

            setIsLoading(true);
            try {
                const data = await companyService.getById(companyId);
                setCompany(data);
            } catch (error) {
                console.error("Failed to fetch company details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanyDetails();
    }, [companyId, isOpen]);

    const handleCopyEmbed = async (embedCode: string, websiteId: string) => {
        try {
            await navigator.clipboard.writeText(embedCode);
            setCopiedEmbedIds(prev => new Set(prev).add(websiteId));
            setTimeout(() => {
                setCopiedEmbedIds(prev => {
                    const next = new Set(prev);
                    next.delete(websiteId);
                    return next;
                });
            }, 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    if (!isOpen) return null;

    return (
        <SlideoutMenu isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SlideoutMenu.Content className="p-0">
                <SlideoutMenu.Header onClose={onClose}>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {isLoading ? "Loading..." : company?.name || "Company Details"}
                        </h2>
                        <p className="text-sm text-gray-500">
                            View and manage company and website details.
                        </p>
                    </div>
                </SlideoutMenu.Header>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : company ? (
                        <>
                            {/* Company Information */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                                    Company Information
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-start gap-3">
                                        <Building02 className="size-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Name</p>
                                            <p className="text-sm text-gray-600">{company.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail01 className="size-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Email</p>
                                            <p className="text-sm text-gray-600">{company.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="size-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Timezone</p>
                                            <p className="text-sm text-gray-600">{company.settings.timezone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Palette className="size-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Theme Color</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div 
                                                    className="size-4 rounded-full border border-gray-200" 
                                                    style={{ backgroundColor: company.settings.themeColor }}
                                                />
                                                <span className="text-sm text-gray-600">{company.settings.themeColor}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Websites */}
                            <section className="space-y-6">
                                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                                    Websites ({company.websites.length})
                                </h3>
                                {company.websites.map((website) => (
                                    <div key={website._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Globe02 className="size-5 text-blue-600" />
                                                <h4 className="font-medium text-gray-900">{website.name}</h4>
                                            </div>
                                            <Badge size="sm" color="success">Active</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 mb-1">URL</p>
                                                <a href={website.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    {website.url}
                                                </a>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Webhook URL</p>
                                                <p className="text-gray-900 truncate" title={website.webhookUrl}>
                                                    {website.webhookUrl || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Widget Position</p>
                                                <p className="text-gray-900 capitalize">{website.widgetConfig.position}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Widget Color</p>
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className="size-3 rounded-full border border-gray-200" 
                                                        style={{ backgroundColor: website.widgetConfig.primaryColor }}
                                                    />
                                                    <span className="text-gray-900">{website.widgetConfig.primaryColor}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-medium text-gray-700">Embed Code</Label>
                                                <Button 
                                                    size="sm" 
                                                    color="tertiary" 
                                                    onClick={() => handleCopyEmbed(website.embedCode, website._id)}
                                                    iconLeading={copiedEmbedIds.has(website._id) ? Check : Copy01}
                                                >
                                                    {copiedEmbedIds.has(website._id) ? "Copied" : "Copy Code"}
                                                </Button>
                                            </div>
                                            <div className="relative">
                                                <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono">
                                                    {website.embedCode}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        </>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            Failed to load company details.
                        </div>
                    )}
                </div>

                <SlideoutMenu.Footer>
                    <div className="flex w-full gap-3">
                        <Button color="secondary" className="w-full" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </SlideoutMenu.Footer>
            </SlideoutMenu.Content>
        </SlideoutMenu>
    );
}
