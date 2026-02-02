import { Badge } from "@/components/base/badges/badges";
import { Monitor01, Globe01 } from "@untitledui/icons";

interface Visitor {
    id: string;
    sessionId?: string;
    name: string;
    countryCode: string;
    country?: string;
    currentPath: string;
    device?: string;
    browser?: string;
    ip?: string;
    sessionStart?: Date;
    durationSeconds?: number;
}

interface ActiveSessionsTableProps {
    visitors: Visitor[];
    now: Date;
}

export const ActiveSessionsTable = ({ visitors, now }: ActiveSessionsTableProps) => {
    return (
        <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm mt-6">
            <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900">Active Visitor Sessions</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                        <tr>
                            <th className="px-6 py-3 font-medium">Session ID</th>
                            <th className="px-6 py-3 font-medium">Page URL</th>
                            <th className="px-6 py-3 font-medium">IP Address</th>
                            <th className="px-6 py-3 font-medium">Device / Browser</th>
                            <th className="px-6 py-3 font-medium">Country</th>
                            <th className="px-6 py-3 font-medium">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {visitors.map((visitor) => {
                            const durationSeconds = visitor.durationSeconds ?? (visitor.sessionStart 
                                ? Math.floor((now.getTime() - new Date(visitor.sessionStart).getTime()) / 1000)
                                : 0);
                            const isLongSession = durationSeconds > 10;
                            
                            return (
                                <tr key={visitor.id} className={isLongSession ? "bg-yellow-50 transition-colors duration-500" : "transition-colors duration-500"}>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {visitor.sessionId || visitor.id.substring(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 truncate max-w-[200px]" title={visitor.currentPath}>
                                        {visitor.currentPath}
                                    </td>
                                    <td className="px-6 py-4">{visitor.ip || 'Unknown'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-1 font-medium text-gray-700">
                                                <Monitor01 className="size-3" />
                                                {visitor.device || 'Desktop'}
                                            </span>
                                            <span className="text-xs text-gray-400">{visitor.browser}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Globe01 className="size-4 text-gray-400" />
                                            {visitor.country || visitor.countryCode}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono">
                                        <Badge color={isLongSession ? "warning" : "gray"}>
                                            {durationSeconds}s
                                        </Badge>
                                    </td>
                                </tr>
                            );
                        })}
                        {visitors.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No active sessions
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
