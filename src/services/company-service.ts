import { apiClient } from "./api-client";

export interface Company {
    _id: string;
    name: string;
    email: string;
    settings: {
        timezone: string;
        themeColor: string;
    };
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export const companyService = {
    getAll: async () => {
        return apiClient.get<Company[]>("/companies");
    },
    create: async (data: CreateCompanyRequest) => {
        return apiClient.post<CreateCompanyResponse>("/companies", data);
    },
    getById: async (id: string) => {
        return apiClient.get<CompanyDetails>(`/companies/${id}`);
    }
};

export interface CreateCompanyRequest {
    companyName: string;
    companyEmail: string;
    websiteName: string;
    websiteUrl: string;
    webhookUrl?: string;
    timezone: string;
    themeColor: string;
    widgetColor: string;
    widgetPosition: "left" | "right";
}

export interface CompanyDetails {
    _id: string;
    name: string;
    email: string;
    settings: {
        timezone: string;
        themeColor: string;
    };
    websites: {
        _id: string;
        companyId: string;
        name: string;
        url: string;
        webhookUrl?: string;
        widgetConfig: {
            primaryColor: string;
            position: string;
        };
        embedCode: string;
        createdAt: string;
        updatedAt: string;
    }[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateCompanyResponse {
    message: string;
    company: {
        id: string;
        name: string;
        email: string;
    };
    website: {
        id: string;
        name: string;
        url: string;
        webhookUrl?: string;
    };
    embedCode: string;
}
