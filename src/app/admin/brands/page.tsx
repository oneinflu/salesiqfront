"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    Building02, 
    SearchLg,
    FilterLines,
    Download01,
    Plus
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { companyService, Company, CreateCompanyResponse } from "@/services/company-service";
import { format } from "date-fns";
import { CreateCompanyModal } from "./create-company-modal";
import { EmbedCodeModal } from "./embed-code-modal";
import { BrandDetailsSlideover } from "./brand-details-slideover";

export default function BrandsPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createdCompanyData, setCreatedCompanyData] = useState<{ name: string; embedCode: string } | null>(null);

    // View Details state
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [isViewSlideoverOpen, setIsViewSlideoverOpen] = useState(false);

    const fetchCompanies = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await companyService.getAll();
            setCompanies(data);
        } catch (error) {
            console.error("Failed to fetch companies:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const handleCreateSuccess = (response: CreateCompanyResponse) => {
        setCreatedCompanyData({
            name: response.company.name,
            embedCode: response.embedCode
        });
        fetchCompanies(); // Refresh the list
    };

    const handleViewCompany = (id: string) => {
        setSelectedCompanyId(id);
        setIsViewSlideoverOpen(true);
    };

    const filteredCompanies = companies.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-gray-50 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Brands</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and view all registered companies.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button color="secondary" iconLeading={Download01}>Export</Button>
                    <Button 
                        color="primary" 
                        iconLeading={Plus}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Add Brand
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search brands..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button color="tertiary" iconLeading={FilterLines}>Filters</Button>
                    <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
                    <span className="text-sm text-gray-500 hidden sm:block">{filteredCompanies.length} brands</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">Loading brands...</div>
                ) : (
                <Table aria-label="Brands table">
                    <Table.Header>
                        <Table.Head isRowHeader>Brand Name</Table.Head>
                        <Table.Head>Email</Table.Head>
                        <Table.Head>Timezone</Table.Head>
                        <Table.Head>Theme Color</Table.Head>
                        <Table.Head>Created At</Table.Head>
                        <Table.Head></Table.Head>
                    </Table.Header>
                    <Table.Body>
                        {filteredCompanies.map((company) => (
                            <Table.Row key={company._id}>
                                <Table.Cell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center size-10 rounded-full bg-blue-100 text-blue-600 font-semibold">
                                            {company.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="font-medium text-gray-900 text-sm">{company.name}</div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-gray-600">{company.email}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge size="sm" color="gray" type="pill-color">
                                        {company.settings?.timezone || "UTC"}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="size-4 rounded-full border border-gray-200" 
                                            style={{ backgroundColor: company.settings?.themeColor || "#000000" }}
                                        ></div>
                                        <span className="text-sm text-gray-600">{company.settings?.themeColor || "#000000"}</span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-sm text-gray-600">
                                        {company.createdAt ? format(new Date(company.createdAt), 'MMM d, yyyy') : "-"}
                                    </span>
                                </Table.Cell>
                                <Table.Cell>
                                    <Button 
                                        size="sm" 
                                        color="tertiary"
                                        onClick={() => handleViewCompany(company._id)}
                                    >
                                        View
                                    </Button>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
                )}
            </div>

            {/* Modals */}
            <CreateCompanyModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={handleCreateSuccess}
            />
            
            {createdCompanyData && (
                <EmbedCodeModal
                    isOpen={!!createdCompanyData}
                    onClose={() => setCreatedCompanyData(null)}
                    embedCode={createdCompanyData.embedCode}
                    companyName={createdCompanyData.name}
                />
            )}

            <BrandDetailsSlideover 
                isOpen={isViewSlideoverOpen}
                onClose={() => setIsViewSlideoverOpen(false)}
                companyId={selectedCompanyId}
            />
        </div>
    );
}
