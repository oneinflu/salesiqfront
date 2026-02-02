"use client";

import { useState, useEffect, useRef } from "react";
import { 
    FilterLines, 
    Send01, 
    Paperclip, 
    FaceSmile, 
    XClose,
    Edit02,
    Copy01,
    Globe01,
    Monitor01,
    ChevronUp,
    MessageChatSquare,
    User01,
    Building02,
    DotsVertical,
    CheckCircle,
    File02,
    Stars02
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Badge, BadgeWithIcon } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { Tabs } from "@/components/application/tabs/tabs";
import { Google, Apple } from "@/components/foundations/social-icons";
import { cx } from "@/utils/cx";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { chatService, Chat as ServiceChat, Message as ServiceMessage } from "@/services/chat-service";
import { socketService } from "@/services/socket-service";
import { format } from "date-fns";

// Types
type ChatStatus = "active" | "missed" | "closed";

interface VisitorInfo {
    browserType: string;
    browserVersion: string;
    referralLink: string;
    ipAddress: string;
    javaSupport: boolean;
    cookieSupport: boolean;
    characterEncoding: string;
    languageAccepted: string;
    screenResolution: string;
    colorDepth: number;
    operatingSystem: string;
    userAgent: string;
    visitorLocation: {
        city: string;
        state: string;
        country: string;
        countryCode: string;
        latitude: number;
        longitude: number;
        locationLink: string;
    };
}

// Extended Chat type for UI
interface Chat extends ServiceChat {
    customerName: string;
    countryCode: string;
    visitorInfo: VisitorInfo;
}

export default function MyChatsPage() {
    const [activeTab, setActiveTab] = useState<ChatStatus>("active");
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    
    // Data State
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<ServiceMessage[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const isSendingRef = useRef(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Derived State
    const selectedChat = chats.find(c => c._id === selectedChatId);

    // Fetch Chats on Tab Change
    useEffect(() => {
        const fetchChats = async () => {
            setIsLoadingChats(true);
            try {
                const data = await chatService.getChats(activeTab);
                
                // Transform API data to UI format
                const transformedChats: Chat[] = data.map(chat => {
                    const visitor = chat.visitorId as any; // Type assertion as visitorId is populated
                    return {
                        ...chat,
                        customerName: visitor?.name || "Visitor " + visitor?._id?.substring(0, 4),
                        countryCode: visitor?.location?.country || "US", // Default or extract
                        visitorInfo: mapVisitorToInfo(visitor)
                    };
                });
                
                setChats(transformedChats);
                
                // Auto-select first chat if none selected or current selection not in list
                if (transformedChats.length > 0) {
                    if (!selectedChatId || !transformedChats.find(c => c._id === selectedChatId)) {
                        setSelectedChatId(transformedChats[0]._id);
                    }
                } else {
                    setSelectedChatId(null);
                }
            } catch (error) {
                console.error("Failed to fetch chats:", error);
            } finally {
                setIsLoadingChats(false);
            }
        };

        fetchChats();
        
        // Optional: Poll for updates
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, [activeTab]);

    // Track last fetched visitor to prevent redundant fetches
    const lastFetchedVisitorIdRef = useRef<string | null>(null);

    // Fetch Messages when Chat Selected
    useEffect(() => {
        if (!selectedChatId || !selectedChat?.visitorId) return;
        
        const visitorId = (selectedChat.visitorId as any)._id;
        
        // Skip if we already fetched for this visitor and the chat ID hasn't changed
        // We only want to fetch when switching chats, not when the current chat updates
        if (visitorId === lastFetchedVisitorIdRef.current) return;

        const fetchHistory = async () => {
            setIsLoadingMessages(true);
            try {
                lastFetchedVisitorIdRef.current = visitorId;
                const msgs = await chatService.getHistory(visitorId);
                setMessages(msgs);
            } catch (error) {
                console.error("Failed to fetch history:", error);
                // Reset ref on error so we can try again
                lastFetchedVisitorIdRef.current = null;
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchHistory();
    }, [selectedChatId, selectedChat?.visitorId]);

    // Track selected chat/visitor for socket events
    const selectedChatIdRef = useRef(selectedChatId);
    const selectedVisitorIdRef = useRef<string | null>(null);
    
    useEffect(() => {
        selectedChatIdRef.current = selectedChatId;
        selectedVisitorIdRef.current = selectedChat?.visitorId ? (selectedChat.visitorId as any)._id : null;
    }, [selectedChatId, selectedChat]);

    // Real-time updates
    useEffect(() => {
        socketService.connect();

        // Sound effect
        const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');

        const handleNewMessage = (message: ServiceMessage) => {
            console.log("ChatPage handleNewMessage:", message._id);
            // Play sound for incoming messages (from visitor)
            if (message.sender === 'visitor') {
                audio.play().catch(e => console.log('Audio play failed:', e));
            }

            setChats(prevChats => {
                const updatedChats = prevChats.map(chat => {
                    const chatVisitorId = (chat.visitorId as any)?._id;
                    if (chatVisitorId === message.visitorId) {
                        // Check if this is the currently selected chat
                        const isSelected = chat._id === selectedChatIdRef.current;
                        
                        return {
                            ...chat,
                            lastMessage: message.text,
                            updatedAt: message.createdAt,
                            unreadCount: (isSelected || message.sender === 'agent') ? (chat.unreadCount || 0) : (chat.unreadCount || 0) + 1
                        };
                    }
                    return chat;
                });
                return updatedChats;
            });

            // Update active conversation messages
            if (message.visitorId === selectedVisitorIdRef.current) {
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
        };
        
        const unsubscribe = socketService.on('new-message', handleNewMessage);
        return () => {
            unsubscribe();
            socketService.disconnect();
        };
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedChat) return;
        
        if (isSendingRef.current) {
             console.log("Message sending already in progress");
             return;
        }
        
        // Robust visitorId extraction
        let visitorId: string | undefined;
        if (selectedChat.visitorId && typeof selectedChat.visitorId === 'object' && '_id' in selectedChat.visitorId) {
            visitorId = (selectedChat.visitorId as any)._id;
        } else if (typeof selectedChat.visitorId === 'string') {
            visitorId = selectedChat.visitorId;
        }

        console.log("Sending message to visitor:", visitorId, "for chat:", selectedChat._id);
        
        if (!visitorId) {
            console.error("Cannot send message: Missing visitor ID for chat", selectedChat);
            alert("Error: Cannot identify visitor for this chat. Please refresh or try another chat.");
            return;
        }
        
        isSendingRef.current = true;
        setIsSending(true);
        try {
            const newMessage = await chatService.sendMessage(visitorId, messageInput);
            console.log("Message sent successfully via API");
            
            // Manually add message to state to ensure it appears immediately
            // This also acts as a fallback if socket event is missed
            if (newMessage) {
                setMessages(prev => {
                    if (prev.some(m => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });

                setChats(prevChats => {
                    const updatedChats = prevChats.map(chat => {
                        if (chat.visitorId && (chat.visitorId as any)._id === newMessage.visitorId) {
                            return {
                                ...chat,
                                lastMessage: newMessage.text,
                                updatedAt: newMessage.createdAt,
                                unreadCount: 0 // Reset unread count since we just sent a message
                            };
                        }
                        return chat;
                    });
                    return updatedChats;
                });
            }

            setMessageInput("");
        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            // Add a small delay to ensure state doesn't bounce too fast, though not strictly necessary
            setTimeout(() => {
                isSendingRef.current = false;
                setIsSending(false);
            }, 100);
        }
    };

    // Helper to map Visitor to VisitorInfo
    const mapVisitorToInfo = (visitor: any): VisitorInfo => {
        // This mapping depends on what data your Visitor model actually has
        // Providing defaults for now based on the mock data structure
        return {
            browserType: "Chrome", // Parse userAgent in real app
            browserVersion: "Latest",
            referralLink: "",
            ipAddress: visitor?.ip || "",
            javaSupport: false,
            cookieSupport: true,
            characterEncoding: "UTF-8",
            languageAccepted: "en-US",
            screenResolution: "1920x1080",
            colorDepth: 24,
            operatingSystem: "Windows", // Parse userAgent
            userAgent: visitor?.userAgent || "",
            visitorLocation: {
                city: visitor?.location?.city || "Unknown",
                state: "",
                country: visitor?.location?.country || "Unknown",
                countryCode: "US",
                latitude: 0,
                longitude: 0,
                locationLink: ""
            }
        };
    };

    // Interaction Handlers (Placeholders)
    const handleCopyEmail = () => console.log("Email copied");
    const handleEditCustomer = () => console.log("Edit customer clicked");
    const handleReplyEmail = () => console.log("Reply via email clicked");
    const handleFilter = () => console.log("Filter clicked");
    const handleAttach = () => console.log("Attach file clicked");
    const handleEmoji = () => console.log("Emoji picker clicked");

    return (
        <div className="flex h-[calc(100vh-64px)] w-full bg-white overflow-hidden">
            {/* Left Sidebar: Chat List */}
            <div className="w-80 flex flex-col border-r border-gray-200 h-full shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">My Chats</h2>
                    <Button size="sm" color="tertiary" iconLeading={FilterLines} onClick={handleFilter} />
                </div>

                {/* Tabs */}
                <div className="px-2 pt-2">
                    <Tabs 
                        selectedKey={activeTab} 
                        onSelectionChange={(key) => setActiveTab(key as ChatStatus)}
                        className="w-full"
                    >
                        <Tabs.List type="underline" fullWidth items={[]}>
                            <Tabs.Item id="active">Active</Tabs.Item>
                            <Tabs.Item id="missed">Missed</Tabs.Item>
                            <Tabs.Item id="closed">Closed</Tabs.Item>
                        </Tabs.List>
                    </Tabs>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoadingChats ? (
                        <div className="p-8 text-center text-gray-500 text-sm">Loading chats...</div>
                    ) : chats.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No {activeTab} chats
                        </div>
                    ) : (
                        chats.map(chat => (
                            <div 
                                key={chat._id}
                                onClick={() => setSelectedChatId(chat._id)}
                                className={cx(
                                    "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                                    selectedChatId === chat._id ? "bg-blue-50/50" : ""
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <Globe01 className="size-3 text-gray-400" />
                                        <span className="font-medium text-sm text-gray-900">{chat.customerName}</span>
                                        <span className="text-xs text-gray-500">#{chat.chatId?.substring(0, 6)}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {chat.lastMessageAt ? format(new Date(chat.lastMessageAt), 'HH:mm') : ''}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{chat.lastMessage || "No messages"}</p>
                                {chat.unreadCount ? (
                                    <div className="mt-2 flex justify-end">
                                        <Badge size="sm" color="brand" type="pill-color">{chat.unreadCount}</Badge>
                                    </div>
                                ) : null}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Middle: Conversation */}
            {selectedChat ? (
                <div className="flex-1 flex flex-col h-full min-w-0">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 text-lg">#{selectedChat.chatId?.substring(0, 8)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Building02 className="size-3" />
                                    <span>SALES IQ</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <User01 className="size-3" />
                                    <span>SALES IQ</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <User01 className="size-3" />
                                    <span>SALES IQ</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" color="tertiary" iconLeading={DotsVertical} />
                            <Button size="sm" color="tertiary" iconLeading={ChevronUp} />
                        </div>
                    </div>

                    {/* Conversation Tags */}
                    <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">Conversation tags</span>
                        <Button size="sm" color="tertiary" className="rounded-full !p-1 h-6 w-6 rotate-45">
                            <XClose className="size-4" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                        {isLoadingMessages ? (
                            <div className="text-center text-gray-500 text-sm mt-10">Loading history...</div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-500 text-sm mt-10">No messages yet</div>
                        ) : (
                            <>
                                {/* Group messages by date could go here */}
                                {messages.map(msg => {
                                    if (msg.sender === 'system') {
                                        return (
                                            <div key={msg._id} className="flex items-center gap-4 py-4">
                                                <div className="h-px bg-gray-200 flex-1"></div>
                                                <span className="text-xs text-gray-400">{msg.text}</span>
                                                <div className="h-px bg-gray-200 flex-1"></div>
                                            </div>
                                        );
                                    }
                                    
                                    const isAgent = msg.sender === 'agent';
                                    
                                    return (
                                        <div key={msg._id} className={cx("flex gap-3 group", isAgent ? "flex-row-reverse" : "")}>
                                            <Avatar 
                                                initials={isAgent ? "A" : selectedChat.customerName.charAt(0)} 
                                                size="sm" 
                                                className={cx(
                                                    "text-xs",
                                                    isAgent ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"
                                                )} 
                                            />
                                            <div className={cx("max-w-[80%]", isAgent ? "text-right" : "")}>
                                                <div className={cx("flex items-baseline gap-2 mb-1", isAgent ? "justify-end" : "")}>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {isAgent ? "Agent" : selectedChat.customerName}
                                                    </span>
                                                </div>
                                                <div className={cx(
                                                    "rounded-lg px-4 py-2 inline-block text-left",
                                                    isAgent ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                                                )}>
                                                    <p className="text-sm">{msg.text}</p>
                                                </div>
                                                <span className="text-xs text-gray-400 ml-2 group-hover:opacity-100 opacity-0 transition-opacity block mt-1">
                                                    {format(new Date(msg.createdAt), 'hh:mm a')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Footer / Input Area */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                        {selectedChat.status === "closed" ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <BadgeWithIcon color="success" size="lg" iconLeading={CheckCircle}>CHAT COMPLETED</BadgeWithIcon>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Ended due to chat idle timeout <span className="text-blue-600 cursor-pointer">Show details</span>
                                    </p>
                                </div>
                                <Button color="primary" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleReplyEmail}>Reply via Email</Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Input 
                                placeholder="Type a message..." 
                                value={messageInput}
                                onChange={(value) => setMessageInput(value)}
                                onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isSendingRef.current) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                                className="pr-24"
                                isDisabled={isSending}
                            />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <Button size="sm" color="tertiary" iconLeading={FaceSmile} onClick={handleEmoji} disabled={isSending} />
                                    <Button size="sm" color="tertiary" iconLeading={Paperclip} onClick={handleAttach} disabled={isSending} />
                                    <Button size="sm" color="primary" iconLeading={Send01} onClick={handleSendMessage} disabled={isSending} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500">
                    Select a chat to start conversation
                </div>
            )}

            {/* Right Sidebar: Customer Info */}
            {selectedChat && (
                <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full overflow-y-auto shrink-0">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-3">
                                <Avatar initials={selectedChat.customerName.charAt(0)} size="lg" className="bg-pink-100 text-pink-600 text-lg" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">{selectedChat.customerName}</h3>
                                    <p className="text-sm text-gray-500">{selectedChat.visitorInfo.visitorLocation.locationLink || "Unknown Location"}</p>
                                </div>
                            </div>
                            <Button size="sm" color="tertiary" iconLeading={Edit02} onClick={handleEditCustomer} />
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <span className="truncate max-w-[180px]">{(selectedChat.visitorId as any)?.email || "No email"}</span>
                                </div>
                                <Button size="sm" color="tertiary" iconLeading={Copy01} className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopyEmail} />
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Globe01 className="size-4 text-gray-400" />
                                <span>{format(new Date(), 'dd MMM, yyyy hh:mm a')}</span>
                            </div>
                            
                            <div 
                                className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:underline"
                                onClick={() => setIsInfoOpen(true)}
                            >
                                <span className="flex items-center gap-2"><div className="size-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">i</div> More info</span>
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                                <Button size="sm" color="tertiary" className="rounded-full !p-0.5 h-5 w-5 rotate-45 bg-gray-200 text-gray-600">
                                    <XClose className="size-3" />
                                </Button>
                                Contact tags
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <InfoRow label="Type" value="New Visitor" />
                        <InfoRow 
                            label="Source" 
                            value={
                                <div className="flex items-center gap-2">
                                    <Monitor01 className="size-4 text-gray-400" />
                                    <Apple className="size-4 text-gray-400" />
                                    <Google className="size-4 text-gray-400" />
                                </div>
                            } 
                        />
                        <InfoRow label="IP address" value={selectedChat.visitorInfo.ipAddress} />
                        <InfoRow 
                            label="Chat initiated page" 
                            value={<span className="text-blue-600 truncate block max-w-[150px]">{selectedChat.visitorInfo.referralLink || "Direct"}</span>} 
                        />
                        <InfoRow 
                            label="Current Page" 
                            value={<span className="text-blue-600 truncate block max-w-[150px]">{(selectedChat.visitorId as any)?.currentPage || "/"}</span>} 
                        />
                    </div>
                </div>
            )}

            {/* Slideout for Visitor Info */}
            <SlideoutMenu isOpen={isInfoOpen} onOpenChange={setIsInfoOpen}>
                <SlideoutMenu.Content>
                    <SlideoutMenu.Header onClose={() => setIsInfoOpen(false)}>
                        <div className="flex items-center gap-2">
                            <Monitor01 className="size-5 text-gray-500" />
                            <span className="font-semibold text-gray-900 uppercase">VISITOR INFORMATION</span>
                        </div>
                    </SlideoutMenu.Header>
                {selectedChat && (
                    <div className="space-y-8 p-6">
                        {/* Browser Info */}
                        <section>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Browser Information</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                <InfoItem label="Browser" value={selectedChat.visitorInfo.browserType} />
                                <InfoItem label="Version" value={selectedChat.visitorInfo.browserVersion} />
                                <InfoItem label="OS" value={selectedChat.visitorInfo.operatingSystem} />
                                <InfoItem label="Resolution" value={selectedChat.visitorInfo.screenResolution} />
                                <InfoItem label="User Agent" value={selectedChat.visitorInfo.userAgent} className="col-span-2 break-all" />
                            </div>
                        </section>

                        <div className="h-px bg-gray-100" />

                        {/* Location Info */}
                        <section>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Location</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                <InfoItem label="City" value={selectedChat.visitorInfo.visitorLocation.city} />
                                <InfoItem label="Country" value={selectedChat.visitorInfo.visitorLocation.country} />
                                <InfoItem label="IP Address" value={selectedChat.visitorInfo.ipAddress} />
                            </div>
                        </section>

                        <div className="h-px bg-gray-100" />

                        {/* Tech Info */}
                        <section>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Technical Details</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                <InfoItem label="Java Enabled" value={selectedChat.visitorInfo.javaSupport ? "Yes" : "No"} />
                                <InfoItem label="Cookies Enabled" value={selectedChat.visitorInfo.cookieSupport ? "Yes" : "No"} />
                                <InfoItem label="Color Depth" value={`${selectedChat.visitorInfo.colorDepth}-bit`} />
                                <InfoItem label="Character Encoding" value={selectedChat.visitorInfo.characterEncoding} />
                            </div>
                        </section>
                    </div>
                )}
                </SlideoutMenu.Content>
            </SlideoutMenu>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-900 font-medium">{value}</span>
        </div>
    );
}

function InfoItem({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <dt className="text-xs text-gray-500 mb-1">{label}</dt>
            <dd className="text-sm font-medium text-gray-900">{value || "-"}</dd>
        </div>
    );
}
