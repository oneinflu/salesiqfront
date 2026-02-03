"use client";

import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { XClose, Copy01, Check } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";

interface EmbedCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    embedCode: string;
    companyName: string;
}

export function EmbedCodeModal({ isOpen, onClose, embedCode, companyName }: EmbedCodeModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(embedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 p-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Integration Complete</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {companyName} has been created successfully.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <XClose className="size-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Copy the following code and paste it into your website's HTML, just before the closing <code>&lt;/body&gt;</code> tag.
                    </p>
                    
                    <div className="relative">
                        <Label htmlFor="embed-code" className="sr-only">Embed Code</Label>
                        <textarea
                            id="embed-code"
                            readOnly
                            value={embedCode}
                            className="w-full h-40 p-4 font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
                        />
                        <div className="absolute top-2 right-2">
                            <Button 
                                size="sm" 
                                color="secondary" 
                                onClick={handleCopy}
                                iconLeading={copied ? Check : Copy01}
                            >
                                {copied ? "Copied" : "Copy"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <Button onClick={onClose} color="primary">
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
}
