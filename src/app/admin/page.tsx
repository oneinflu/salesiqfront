"use client";

import { Button } from "@/components/base/buttons/button";
import { 
    Plus, 
    Users01, 
    Clock, 
    Eye, 
    File02, 
    Hourglass01, 
    Monitor01, 
    Share01, 
    Globe01,
    Calendar,
    FilterLines
} from "@untitledui/icons";
import { StatCard } from "./components/stat-card";
import { Table, TableCard } from "@/components/application/table/table";

const kpis = [
    {
        title: "Total Visits",
        value: "242.5k",
        trend: { value: "12%", direction: "up" as const, label: "vs last month" },
        icon: Users01,
        tooltip: "Total number of visits across all pages",
        color: "brand" as const
    },
    {
        title: "Avg Visit Duration",
        value: "2m 45s",
        trend: { value: "5%", direction: "up" as const, label: "vs last month" },
        icon: Clock,
        tooltip: "Average time spent per visit",
        color: "warning" as const
    },
    {
        title: "Total Page Views",
        value: "1.2M",
        trend: { value: "8%", direction: "up" as const, label: "vs last month" },
        icon: Eye,
        tooltip: "Total number of page views",
        color: "success" as const
    },
    {
        title: "Avg Page per visit",
        value: "4.5",
        trend: { value: "2%", direction: "up" as const, label: "vs last month" },
        icon: File02,
        tooltip: "Average pages viewed per visit",
        color: "brand" as const
    },
    {
        title: "Avg time on page",
        value: "1m 20s",
        trend: { value: "1%", direction: "down" as const, label: "vs last month" },
        icon: Hourglass01,
        tooltip: "Average time spent on a single page",
        color: "error" as const
    },
];

const deviceStats = [
    { device: "Desktop", visits: "145.5k", percentage: "60%" },
    { device: "Mobile", visits: "84.9k", percentage: "35%" },
    { device: "Tablet", visits: "12.1k", percentage: "5%" },
];

const sourceStats = [
    { source: "Direct", visits: "97k", percentage: "40%" },
    { source: "Organic Search", visits: "72.7k", percentage: "30%" },
    { source: "Social", visits: "48.5k", percentage: "20%" },
    { source: "Referral", visits: "24.2k", percentage: "10%" },
];

const regionStats = [
    { region: "United States", visits: "97k", percentage: "40%", bounceRate: "45%" },
    { region: "United Kingdom", visits: "48.5k", percentage: "20%", bounceRate: "42%" },
    { region: "India", visits: "36.4k", percentage: "15%", bounceRate: "48%" },
    { region: "Germany", visits: "24.2k", percentage: "10%", bounceRate: "40%" },
    { region: "Others", visits: "36.4k", percentage: "15%", bounceRate: "50%" },
];

export default function AdminDashboard() {
    return (
        <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display-xs font-semibold text-primary">Dashboard</h1>
                    <p className="mt-2 text-md text-tertiary">Overview of your key performance indicators and analytics.</p>
                </div>
                <div className="mt-4 flex gap-3 sm:mt-0 sm:ml-16 sm:flex-none">
                    <Button color="secondary" iconLeading={Calendar}>
                        Last 30 days
                    </Button>
                    <Button color="secondary" iconLeading={FilterLines}>
                        Filters
                    </Button>
                    <Button color="primary" iconLeading={Plus}>
                        Add Report
                    </Button>
                </div>
            </div>
            
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {kpis.map((kpi) => (
                    <StatCard key={kpi.title} {...kpi} />
                ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                <TableCard.Root>
                    <TableCard.Header title="Visits by Device" description="Breakdown of visits by device type." />
                    <Table aria-label="Device Stats">
                        <Table.Header columns={[
                            { name: "Device", isRowHeader: true, id: "device" },
                            { name: "Visits", id: "visits" },
                            { name: "Percentage", id: "percentage" }
                        ]}>
                            {(column) => <Table.Head isRowHeader={column.isRowHeader}>{column.name}</Table.Head>}
                        </Table.Header>
                        <Table.Body items={deviceStats}>
                            {(item) => (
                                <Table.Row id={item.device}>
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            <Monitor01 className="size-4 text-tertiary" />
                                            <span className="font-medium text-primary">{item.device}</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>{item.visits}</Table.Cell>
                                    <Table.Cell>{item.percentage}</Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </TableCard.Root>

                <TableCard.Root>
                    <TableCard.Header title="Visits by Source" description="Traffic sources driving visits." />
                    <Table aria-label="Source Stats">
                        <Table.Header columns={[
                            { name: "Source", isRowHeader: true, id: "source" },
                            { name: "Visits", id: "visits" },
                            { name: "Percentage", id: "percentage" }
                        ]}>
                            {(column) => <Table.Head isRowHeader={column.isRowHeader}>{column.name}</Table.Head>}
                        </Table.Header>
                        <Table.Body items={sourceStats}>
                            {(item) => (
                                <Table.Row id={item.source}>
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            <Share01 className="size-4 text-tertiary" />
                                            <span className="font-medium text-primary">{item.source}</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>{item.visits}</Table.Cell>
                                    <Table.Cell>{item.percentage}</Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </TableCard.Root>
            </div>

            <div className="mt-8">
                <TableCard.Root>
                    <TableCard.Header title="Visits by Region" description="Geographic distribution of your visitors." />
                    <Table aria-label="Region Stats">
                        <Table.Header columns={[
                            { name: "Region", isRowHeader: true, id: "region" },
                            { name: "Visits", id: "visits" },
                            { name: "Percentage", id: "percentage" },
                            { name: "Bounce Rate", id: "bounceRate" }
                        ]}>
                            {(column) => <Table.Head isRowHeader={column.isRowHeader}>{column.name}</Table.Head>}
                        </Table.Header>
                        <Table.Body items={regionStats}>
                            {(item) => (
                                <Table.Row id={item.region}>
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            <Globe01 className="size-4 text-tertiary" />
                                            <span className="font-medium text-primary">{item.region}</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>{item.visits}</Table.Cell>
                                    <Table.Cell>{item.percentage}</Table.Cell>
                                    <Table.Cell>{item.bounceRate}</Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </TableCard.Root>
            </div>
        </div>
    );
}
