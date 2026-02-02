import React, { useMemo } from 'react';
import { Avatar } from "@/components/base/avatar/avatar";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
import { Tooltip } from "@/components/base/tooltip/tooltip";

export interface VisitorSession {
    sessionId: string;
    durationSeconds: number;
    country: string;
    avatarUrl?: string;
    name?: string; // Adding name for tooltip
    currentPath?: string; // Adding path for tooltip
}

interface RingViewProps {
    sessions: VisitorSession[];
}

export const RingView: React.FC<RingViewProps> = ({ sessions }) => {
    // Center point of the container
    const cx = 400; // Assuming 800x800 container or similar, will center via CSS/SVG
    const cy = 400;

    // Ring Configuration
    const rings = [
        { radius: 100, label: "2m" },
        { radius: 180, label: "1m" },
        { radius: 260, label: "10s" },
        { radius: 340, label: "New (0s)" },
    ];

    const getRingPosition = (durationSeconds: number): number => {
        // "Inward movement is longer duration"
        // 0s starts at outer ring (340)
        // Moves inward to Center Hub (60)
        
        if (durationSeconds < 10) {
            // 0-10s: 340 -> 260
            return 340 - (durationSeconds / 10) * (340 - 260);
        } else if (durationSeconds < 60) {
            // 10-60s: 260 -> 180
            return 260 - ((durationSeconds - 10) / 50) * (260 - 180);
        } else if (durationSeconds < 120) {
            // 60-120s: 180 -> 100
            return 180 - ((durationSeconds - 60) / 60) * (180 - 100);
        } else if (durationSeconds < 300) {
            // 120-300s: 100 -> 60
            return 100 - ((durationSeconds - 120) / 180) * (100 - 60);
        } else {
            // > 300s: Stay at 60 (Center Hub edge)
            return 60; 
        }
    };

    return (
        <div className="ring-container">
            {/* SVG Background for Rings */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 800">
                <g transform="translate(400, 400)">
                    {rings.map((ring, i) => (
                        <circle
                            key={i}
                            r={ring.radius}
                            className="ring-circle"
                        />
                    ))}
                </g>
            </svg>

            {/* Center Hub (Company Logo) */}
            <div 
                className="absolute z-10 flex items-center justify-center rounded-full bg-orange-50 shadow-sm"
                style={{ 
                    width: '80px', 
                    height: '80px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500 shadow-md">
                    <UntitledLogoMinimal className="w-6 h-6 text-white" />
                </div>
            </div>

            {/* Visitors */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 w-0 h-0">
                    {sessions.map((session) => {
                        const radius = getRingPosition(session.durationSeconds);
                        
                        // Calculate Angle based on sessionId hash
                        const hash = session.sessionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        const angleDeg = (hash % 360);
                        const angleRad = angleDeg * (Math.PI / 180);

                        const x = radius * Math.cos(angleRad);
                        const y = radius * Math.sin(angleRad);

                        return (
                            <div
                                key={session.sessionId}
                                className="visitor-node"
                                style={{
                                    transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
                                }}
                            >
                                <Tooltip title={`${session.name || 'Visitor'}\nDuration: ${session.durationSeconds}s\n${session.country}`}>
                                    <div className="transition-transform hover:scale-125">
                                        <Avatar 
                                            initials={session.country} 
                                            src={session.avatarUrl}
                                            alt={session.country}
                                            size="sm"
                                            className="shadow-sm border-2 border-white ring-1 ring-gray-100"
                                        />
                                    </div>
                                </Tooltip>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="absolute bottom-4 left-4 text-xs text-gray-400">
                Inward movement = Longer duration
            </div>
        </div>
    );
};
