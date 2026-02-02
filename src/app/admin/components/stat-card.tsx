"use client";

import type { FC } from "react";
import { ArrowUp, ArrowDown, InfoCircle } from "@untitledui/icons";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Tooltip } from "@/components/base/tooltip/tooltip";

interface StatCardProps {
    title: string;
    value: string;
    trend?: {
        value: string;
        direction: "up" | "down" | "neutral";
        label?: string;
    };
    icon: FC<any>;
    tooltip?: string;
    color?: "brand" | "gray" | "error" | "warning" | "success";
}

export function StatCard({ title, value, trend, icon: Icon, tooltip, color = "brand" }: StatCardProps) {
    return (
        <div className="flex h-full flex-col justify-between rounded-xl border border-secondary bg-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-tertiary">{title}</p>
                    {tooltip && (
                        <Tooltip title={tooltip}>
                             <InfoCircle className="size-4 text-tertiary cursor-pointer" />
                        </Tooltip>
                    )}
                </div>
                <FeaturedIcon icon={Icon} color={color} theme="modern" size="md" />
            </div>
            
            <div className="mt-5 flex flex-col gap-4">
                <h3 className="text-display-md font-semibold tracking-tight text-primary">{value}</h3>
                
                {trend && (
                     <div className="flex items-center gap-2">
                        <BadgeWithIcon 
                            color={trend.direction === "up" ? "success" : trend.direction === "down" ? "error" : "gray"}
                            size="sm"
                            iconLeading={trend.direction === "up" ? ArrowUp : trend.direction === "down" ? ArrowDown : undefined}
                        >
                            {trend.value}
                        </BadgeWithIcon>
                        {trend.label && <span className="truncate text-sm font-medium text-tertiary">{trend.label}</span>}
                     </div>
                )}
            </div>
        </div>
    );
}
