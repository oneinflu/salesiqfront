"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { 
    HomeLine, 
    MessageChatSquare, 
    HelpCircle, 
    File02, 
    Send01,
    XClose,
    FaceSmile,
    Paperclip
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";
import { io, Socket } from "socket.io-client";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";

const SOCKET_URL = 'http://localhost:5001';

// Types
type ViewState = "home" | "conversation" | "faqs" | "articles";

interface Message {
    _id: string;
    text: string;
    sender: 'agent' | 'visitor' | 'system';
    createdAt: string;
    tempId?: string; // For optimistic updates
}

function WidgetContent() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get("companyId");
    const websiteId = searchParams.get("websiteId");
    const parentUrl = searchParams.get("parentUrl");
    
    // Show error if configuration is missing
    if (!companyId) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 p-4 text-center">
                <div className="max-w-xs text-sm text-red-600">
                    <p className="font-semibold mb-1">Configuration Error</p>
                    <p>Missing company ID. Please check your embed code.</p>
                </div>
            </div>
        );
    }
    
    const [view, setView] = useState<ViewState>("home");
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [visitorId, setVisitorId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // Lead Capture State
    const [hasLeadInfo, setHasLeadInfo] = useState(false);
    const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "" });
    const [isSubmittingLead, setIsSubmittingLead] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const isSendingRef = useRef(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    // State for FAQs and Articles
    const [faqs, setFaqs] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(false);

    // Initialize Socket and Visitor
    useEffect(() => {
        // Generate or retrieve IDs
        let storedVisitorId = localStorage.getItem("salesiq_visitor_id");
        // Remove self-generated random IDs that are not valid ObjectIds (approximate check: 24 hex chars)
        // This prevents sending invalid IDs to the backend
        if (storedVisitorId && !/^[0-9a-fA-F]{24}$/.test(storedVisitorId)) {
            storedVisitorId = null;
            localStorage.removeItem("salesiq_visitor_id");
        }
        
        setVisitorId(storedVisitorId);

        // Fetch existing history and visitor details to restore state
        if (storedVisitorId) {
            // 1. Fetch History
            fetch(`${SOCKET_URL}/api/chats/history/${storedVisitorId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        setMessages(data);
                        // If we have messages, we likely want to show them
                    }
                })
                .catch(err => console.error("Failed to fetch history:", err));

            // 2. Fetch Visitor Details (to check if lead info exists)
            fetch(`${SOCKET_URL}/api/visitors/${storedVisitorId}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Visitor not found');
                })
                .then(visitor => {
                    if (visitor.email || visitor.phone) {
                        setHasLeadInfo(true);
                    }
                })
                .catch(() => {
                    // Visitor might not exist yet on backend if new, ignore
                });
        }

        let currentSessionId = sessionStorage.getItem("salesiq_session_id");
        if (!currentSessionId) {
            currentSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem("salesiq_session_id", currentSessionId);
        }
        
        // Connect to socket
        socketRef.current = io(SOCKET_URL);
        const socket = socketRef.current;

        // Sound effect
        const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');

        if (socket) {
            socket.on('connect', () => {
                setIsConnected(true);
                
                // Join as visitor
                socket.emit('visitor:join', {
                    companyId,
                    existingVisitorId: storedVisitorId,
                    sessionId: currentSessionId,
                    userAgent: navigator.userAgent,
                    pageUrl: parentUrl || window.location.href, 
                    websiteId: websiteId || undefined
                });
            });

            socket.on('visitor-registered', (visitor: any) => {
                setVisitorId(visitor._id);
                localStorage.setItem("salesiq_visitor_id", visitor._id);
                
                // Check if visitor already has lead info
                if (visitor.email || visitor.phone) {
                    setHasLeadInfo(true);
                }
            });

            socket.on('new-message', (message: any) => {
                setMessages(prev => {
                    // 1. If we have a temp message that matches the incoming tempId, replace it
                    if (message.tempId) {
                        const existingTempIndex = prev.findIndex(m => m._id === message.tempId);
                        if (existingTempIndex !== -1) {
                            const newMessages = [...prev];
                            newMessages[existingTempIndex] = message;
                            return newMessages;
                        }
                    }

                    // 2. Fallback deduplication by real ID
                    if (prev.some(m => m._id === message._id)) return prev;
                    
                    return [...prev, message];
                });
                
                // Play sound for incoming messages (not from self)
                if (message.sender !== 'visitor') {
                    audio.play().catch(e => console.log('Audio play failed:', e));
                    // Notify parent to open on ANY incoming agent message
                    window.parent.postMessage({ type: 'salesiq:open' }, '*');
                }

                // Auto-switch to conversation view
                if (view !== 'conversation') {
                    setView('conversation');
                }
            });
        }

        // Heartbeat every second
        const heartbeatInterval = setInterval(() => {
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('visitor:heartbeat', {
                    sessionId: currentSessionId
                });
            }
        }, 1000);

        return () => {
            clearInterval(heartbeatInterval);
            socket.disconnect();
        };
    }, [companyId]);

    // Handle Lead Submission
    const handleLeadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitorId || !leadForm.name || !leadForm.email) return;

        setIsSubmittingLead(true);
        const socket = socketRef.current;
        
        if (socket) {
            socket.emit('lead:capture', {
                ...leadForm,
                visitorId,
                companyId
            });
            
            // Assume success for UX speed, or wait for confirmation event if strict
            setHasLeadInfo(true);
            setIsSubmittingLead(false);
        }
    };



    // Fetch Content (FAQs/Articles) when view changes
    useEffect(() => {
        if (view === 'faqs' && faqs.length === 0) {
            setIsLoadingContent(true);
            fetch(`${SOCKET_URL}/api/faqs`)
                .then(res => res.json())
                .then(data => setFaqs(data))
                .catch(err => console.error("Failed to fetch FAQs:", err))
                .finally(() => setIsLoadingContent(false));
        }
        if (view === 'articles' && articles.length === 0) {
            setIsLoadingContent(true);
            fetch(`${SOCKET_URL}/api/articles`)
                .then(res => res.json())
                .then(data => setArticles(data))
                .catch(err => console.error("Failed to fetch Articles:", err))
                .finally(() => setIsLoadingContent(false));
        }
    }, [view]);

    // Scroll to bottom
    useEffect(() => {
        if (view === "conversation") {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, view]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !visitorId || isSendingRef.current) return;

        const socket = socketRef.current;
        if (socket) {
            isSendingRef.current = true;
            setIsSending(true);

            // Optimistic Update
            const tempId = `temp-${Date.now()}`;
            const optimisticMessage: Message = {
                _id: tempId,
                text: inputValue,
                sender: 'visitor',
                createdAt: new Date().toISOString()
            };

            setMessages(prev => [...prev, optimisticMessage]);

            socket.emit('visitor-message', {
                visitorId,
                text: inputValue,
                companyId,
                tempId // Send tempId for correlation
            });

            setInputValue("");
            
            // Re-enable after a short delay to allow socket event to process/prevent double-clicks
            setTimeout(() => {
                isSendingRef.current = false;
                setIsSending(false);
            }, 1000);
        }
    };

    // Notify parent window about widget state (open/close) or size changes
    // This is handled by the embed script, but we can emit events if needed.

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-blue-600 p-6 text-white shrink-0 relative">
                <div className="mb-4">
                    <div className="bg-white/20 p-2 rounded-lg inline-block mb-4">
                        <BuildingIcon className="size-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-1">SALES IQ</h1>
                    <p className="text-blue-100 text-sm">We are here to help you!</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative">
                {view === "home" && (
                    <div className="p-4 h-full overflow-y-auto">
                        <div 
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setView("conversation")}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                    <MessageChatSquare className="size-5" />
                                </div>
                                <span className="font-medium text-gray-900">Chat with us now</span>
                            </div>
                            <div className="text-gray-400">
                                <ChevronRight className="size-5" />
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Conversations</h3>
                            {messages.length > 0 ? (
                                <div 
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => setView("conversation")}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-green-100 p-2 rounded-full text-green-600">
                                            <MessageChatSquare className="size-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-900 text-sm">Support Team</span>
                                                <span className="text-xs text-gray-400">
                                                    {format(new Date(messages[messages.length - 1].createdAt), 'MMM d')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 pl-[44px]">
                                        {messages[messages.length - 1].sender === 'visitor' ? 'You: ' : ''}
                                        {messages[messages.length - 1].text}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No recent conversations
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === "conversation" && (
                    <div className="flex flex-col h-full">
                        {!hasLeadInfo ? (
                            <div className="flex-1 p-6 flex flex-col justify-center bg-white">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Introduce yourself</h2>
                                    <p className="text-sm text-gray-500">Please fill out the form below to start chatting with our team.</p>
                                </div>
                                <form onSubmit={handleLeadSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <Input 
                                            id="name"
                                            placeholder="John Doe" 
                                            value={leadForm.name}
                                            onChange={(value) => setLeadForm(prev => ({ ...prev, name: value }))}
                                            isRequired
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <Input 
                                            id="email"
                                            type="email"
                                            placeholder="john@example.com" 
                                            value={leadForm.email}
                                            onChange={(value) => setLeadForm(prev => ({ ...prev, email: value }))}
                                            isRequired
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <Input 
                                            id="phone"
                                            type="tel"
                                            placeholder="+1 (555) 000-0000" 
                                            value={leadForm.phone}
                                            onChange={(value) => setLeadForm(prev => ({ ...prev, phone: value }))}
                                            isRequired
                                        />
                                    </div>
                                    <Button 
                                        type="submit" 
                                        color="primary" 
                                        className="w-full justify-center bg-blue-600 hover:bg-blue-700"
                                        disabled={isSubmittingLead}
                                    >
                                        {isSubmittingLead ? "Starting Chat..." : "Start Chat"}
                                    </Button>
                                </form>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            Start a conversation with us!
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div 
                                                key={msg._id} 
                                                className={cx(
                                                    "flex flex-col max-w-[85%]",
                                                    msg.sender === 'visitor' ? "self-end items-end" : "self-start items-start"
                                                )}
                                            >
                                                <div className={cx(
                                                    "px-4 py-2 rounded-2xl text-sm",
                                                    msg.sender === 'visitor' 
                                                        ? "bg-blue-600 text-white rounded-br-none" 
                                                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                                                )}>
                                                    {msg.text}
                                                </div>
                                                <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                    {format(new Date(msg.createdAt), 'hh:mm a')}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                
                                <div className="p-3 bg-white border-t border-gray-200">
                                    <div className="relative">
                                        <Input 
                                            placeholder="Reply here..." 
                                            value={inputValue}
                                            onChange={(value) => setInputValue(value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !isSendingRef.current) {
                                                    handleSendMessage();
                                                }
                                            }}
                                            className="pr-10"
                                            isDisabled={isSending || !isConnected || !visitorId}
                                        />
                                        <button 
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 p-1 disabled:opacity-50"
                                            onClick={handleSendMessage}
                                            disabled={isSending || !isConnected || !visitorId}
                                        >
                                            <Send01 className="size-5" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 px-1">
                                        <button className="text-gray-400 hover:text-gray-600"><FaceSmile className="size-5" /></button>
                                        <button className="text-gray-400 hover:text-gray-600"><Paperclip className="size-5" /></button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
                
                {view === "faqs" && (
                    <div className="p-4 h-full overflow-y-auto">
                        {isLoadingContent ? (
                            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading FAQs...</div>
                        ) : faqs.length > 0 ? (
                            <div className="space-y-4">
                                {faqs.map((faq: any) => (
                                    <div key={faq._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                                        <p className="text-sm text-gray-600">{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No FAQs available</div>
                        )}
                    </div>
                )}
                
                {view === "articles" && (
                    <div className="p-4 h-full overflow-y-auto">
                        {isLoadingContent ? (
                            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading Articles...</div>
                        ) : articles.length > 0 ? (
                            <div className="space-y-4">
                                {articles.map((article: any) => (
                                    <div key={article._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                                        <p className="text-sm text-gray-500 line-clamp-3 mb-2">{article.content}</p>
                                        <button className="text-blue-600 text-xs font-medium hover:underline">Read more</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No articles available</div>
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-white border-t border-gray-200 shrink-0">
                <div className="grid grid-cols-4 h-16">
                    <NavButton 
                        active={view === "home"} 
                        onClick={() => setView("home")} 
                        icon={HomeLine} 
                        label="Home" 
                    />
                    <NavButton 
                        active={view === "conversation"} 
                        onClick={() => setView("conversation")} 
                        icon={MessageChatSquare} 
                        label="Conversation" 
                    />
                    <NavButton 
                        active={view === "faqs"} 
                        onClick={() => setView("faqs")} 
                        icon={HelpCircle} 
                        label="FAQs" 
                    />
                    <NavButton 
                        active={view === "articles"} 
                        onClick={() => setView("articles")} 
                        icon={File02} 
                        label="Articles" 
                    />
                </div>
                <div className="bg-gray-50 py-1 text-center border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                        <span className="text-red-400">⚡</span> Driven by  SalesIQ
                    </span>
                </div>
            </nav>
        </div>
    );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button 
            onClick={onClick}
            className={cx(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
            )}
        >
            <Icon className={cx("size-5", active ? "stroke-[2.5px]" : "stroke-2")} />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}

function BuildingIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 22H16M12 2V22M3 22H21M5 22V10M19 22V10M5 10L12 2L19 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function WidgetPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WidgetContent />
        </Suspense>
    );
}
