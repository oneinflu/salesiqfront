"use client";

import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { XClose } from "@untitledui/icons";
import { companyService, CreateCompanyRequest, CreateCompanyResponse } from "@/services/company-service";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";

interface CreateCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: CreateCompanyResponse) => void;
}

export function CreateCompanyModal({ isOpen, onClose, onSuccess }: CreateCompanyModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<CreateCompanyRequest>({
        companyName: "",
        companyEmail: "",
        websiteName: "",
        websiteUrl: "",
        webhookUrl: "",
        timezone: "UTC",
        themeColor: "#000000",
        widgetColor: "#007bff",
        widgetPosition: "right"
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await companyService.create(formData);
            onSuccess(response);
            onClose();
        } catch (error) {
            console.error("Failed to create company:", error);
            // Could add toast error handling here
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: keyof CreateCompanyRequest, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900">Add New Brand</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <XClose className="size-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Company Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input 
                                id="companyName"
                                placeholder="e.g. Tech Corp"
                                value={formData.companyName}
                                onChange={(value) => handleChange("companyName", value)}
                                isRequired
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="companyEmail">Company Email</Label>
                            <Input 
                                id="companyEmail"
                                type="email"
                                placeholder="contact@company.com"
                                value={formData.companyEmail}
                                onChange={(value) => handleChange("companyEmail", value)}
                                isRequired
                            />
                        </div>
                    </div>

                    {/* Website Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="websiteName">Website Name</Label>
                            <Input 
                                id="websiteName"
                                placeholder="e.g. Tech Corp Site"
                                value={formData.websiteName}
                                onChange={(value) => handleChange("websiteName", value)}
                                isRequired
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="websiteUrl">Website URL</Label>
                            <Input 
                                id="websiteUrl"
                                placeholder="https://example.com"
                                value={formData.websiteUrl}
                                onChange={(value) => handleChange("websiteUrl", value)}
                                isRequired
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                        <Input 
                            id="webhookUrl"
                            placeholder="https://crm.example.com/hooks/leads"
                            value={formData.webhookUrl}
                            onChange={(value) => handleChange("webhookUrl", value)}
                        />
                    </div>

                    {/* Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="timezone">Timezone</Label>
                            <Input 
                                id="timezone"
                                value={formData.timezone}
                                onChange={(value) => handleChange("timezone", value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="widgetPosition">Widget Position</Label>
                            <Select 
                                selectedKey={formData.widgetPosition}
                                onSelectionChange={(key) => handleChange("widgetPosition", key as "left" | "right")}
                            >
                                <SelectItem id="right">Right</SelectItem>
                                <SelectItem id="left">Left</SelectItem>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="themeColor">Theme Color</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="themeColor"
                                    type="color"
                                    className="w-12 p-1 h-10"
                                    value={formData.themeColor}
                                    onChange={(value) => handleChange("themeColor", value)}
                                />
                                <Input 
                                    value={formData.themeColor}
                                    onChange={(value) => handleChange("themeColor", value)}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="widgetColor">Widget Color</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="widgetColor"
                                    type="color"
                                    className="w-12 p-1 h-10"
                                    value={formData.widgetColor}
                                    onChange={(value) => handleChange("widgetColor", value)}
                                />
                                <Input 
                                    value={formData.widgetColor}
                                    onChange={(value) => handleChange("widgetColor", value)}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button type="button" color="secondary" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" color="primary" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Brand"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
