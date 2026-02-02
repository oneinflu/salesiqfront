"use client";

import { useState } from "react";
import { Code01, Copy01, Check } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

export default function IntegrationPage() {
    const [copied, setCopied] = useState(false);
    
    // In a real app, this URL would be dynamic based on environment
    // Using a stable default for now, but this prepares the structure for production usage
    const companyId = "697e03f744d6d61aec26d272"; 
    const websiteId = "697e03f744d6d61aec26d276"; 
    
    const scriptCode = `<script>window.$salesiq=window.$salesiq||{};$salesiq.ready=function(){};</script>
<script id="salesiqscript" src="http://localhost:3000/embed.js?companyId=${companyId}&websiteId=${websiteId}" defer></script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(scriptCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Code01 className="size-6 text-gray-500" />
                    Add live chat to your website
                </h1>
            </div>

            <div className="p-8 max-w-4xl">
                <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Your live chat widget code is ready for you</h2>
                    <p className="text-gray-600 mb-6">
                        Copy and paste the below code before the closing <code className="text-pink-600 bg-pink-50 px-1 rounded">&lt;/body&gt;</code> tag of your website's HTML source code.
                    </p>

                    <div className="relative group">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 font-mono text-sm text-gray-800 leading-relaxed break-all shadow-sm">
                            {scriptCode}
                        </div>
                        <div className="absolute top-4 right-4">
                            <Button 
                                size="sm" 
                                color="secondary" 
                                iconLeading={copied ? Check : Copy01}
                                onClick={handleCopy}
                            >
                                {copied ? "Copied" : "Copy this code"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 border-t border-gray-100 pt-8">
                    <h3 className="font-medium text-gray-900">Related resources</h3>
                    <ul className="space-y-3">
                        <li>
                            <a href="#" className="text-blue-600 hover:underline hover:text-blue-700 flex items-center gap-2">
                                How do I add the SalesIQ live chat to my WordPress website?
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-blue-600 hover:underline hover:text-blue-700 flex items-center gap-2">
                                Why is the SalesIQ live chat not showing up on my website?
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-blue-600 hover:underline hover:text-blue-700 flex items-center gap-2">
                                How do I customize the SalesIQ live chat to match my website?
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
