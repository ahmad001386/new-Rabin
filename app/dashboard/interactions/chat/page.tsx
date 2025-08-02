'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    Send,
    Plus,
    Search,
    Phone,
    Video,
    MoreHorizontal,
    Paperclip,
    Smile,
    Users,
    MessageCircle,
    Clock,
    Check,
    CheckCheck,
    Image as ImageIcon,
    File,
    X
} from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    status: 'online' | 'away' | 'offline';
}

interface Conversation {
    id: string;
    title?: string;
    type: 'direct' | 'group' | 'support';
    avatar_url?: string;
    is_active: boolean;
    last_message_id?: string;
    last_message_at: string;
    participants: User[];
    unread_count?: number;
    last_message?: Message;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender: User;
    message_type: 'text' | 'image' | 'file' | 'system';
    content: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    reply_to_id?: string;
    reply_to?: Message;
    is_edited: boolean;
    is_deleted: boolean;
    sent_at: string;
    edited_at?: string;
}

export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [showNewChat, setShowNewChat] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const { toast } = useToast();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        fetchConversations();
        fetchUsers();
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
        }
    }, [activeConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/chat/conversations');
            const data = await response.json();

            if (data.success) {
                setConversations(data.data);
                if (data.data.length > 0 && !activeConversation) {
                    setActiveConversation(data.data[0]);
                }
            } else {
                toast({
                    title: "خطا",
                    description: "خطا در بارگذاری مکالمات",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();

            if (data.success) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/chat/conversations/${conversationId}/messages`);
            const data = await response.json();

            if (data.success) {
                setMessages(data.data);
            } else {
                toast({
                    title: "خطا",
                    description: "خطا در بارگذاری پیام‌ها",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeConversation || sending) return;

        setSending(true);
        const messageContent = newMessage.trim();
        setNewMessage('');

        try {
            const response = await fetch(`/api/chat/conversations/${activeConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: messageContent,
                    message_type: 'text'
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Add the message to local state immediately for better UX
                const newMsg: Message = {
                    id: data.data.id,
                    conversation_id: activeConversation.id,
                    sender_id: '1', // Should come from auth
                    sender: {
                        id: '1',
                        name: 'شما',
                        email: '',
                        status: 'online'
                    },
                    message_type: 'text',
                    content: messageContent,
                    is_edited: false,
                    is_deleted: false,
                    sent_at: new Date().toISOString()
                };

                setMessages(prev => [...prev, newMsg]);

                // Refresh conversations to update last message
                fetchConversations();
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در ارسال پیام",
                    variant: "destructive"
                });
                // Restore the message if sending failed
                setNewMessage(messageContent);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
            // Restore the message if sending failed
            setNewMessage(messageContent);
        } finally {
            setSending(false);
        }
    };

    const handleCreateConversation = async () => {
        if (selectedUsers.length === 0) {
            toast({
                title: "خطا",
                description: "لطفاً حداقل یک کاربر انتخاب کنید",
                variant: "destructive"
            });
            return;
        }

        try {
            const response = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participants: selectedUsers,
                    type: selectedUsers.length === 1 ? 'direct' : 'group',
                    title: selectedUsers.length > 1 ? 'گروه جدید' : undefined
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "موفق",
                    description: "مکالمه جدید ایجاد شد"
                });
                setShowNewChat(false);
                setSelectedUsers([]);
                fetchConversations();
            } else {
                toast({
                    title: "خطا",
                    description: data.message || "خطا در ایجاد مکالمه",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            toast({
                title: "خطا",
                description: "خطا در اتصال به سرور",
                variant: "destructive"
            });
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        } else if (diffInDays === 1) {
            return 'دیروز';
        } else if (diffInDays < 7) {
            return `${diffInDays} روز پیش`;
        } else {
            return date.toLocaleDateString('fa-IR');
        }
    };

    const getConversationTitle = (conversation: Conversation) => {
        if (conversation.title) return conversation.title;

        if (conversation.type === 'direct') {
            const otherParticipant = conversation.participants.find(p => p.id !== '1'); // Should use actual user ID
            return otherParticipant?.name || 'مکالمه مستقیم';
        }

        return `گروه ${conversation.participants.length} نفره`;
    };

    const getConversationAvatar = (conversation: Conversation) => {
        if (conversation.avatar_url) return conversation.avatar_url;

        if (conversation.type === 'direct') {
            const otherParticipant = conversation.participants.find(p => p.id !== '1');
            return otherParticipant?.avatar_url;
        }

        return undefined;
    };

    const getConversationInitials = (conversation: Conversation) => {
        if (conversation.type === 'direct') {
            const otherParticipant = conversation.participants.find(p => p.id !== '1');
            return otherParticipant?.name.split(' ').map(n => n[0]).join('') || 'M';
        }

        return 'G';
    };

    const filteredConversations = conversations.filter(conv =>
        getConversationTitle(conv).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-120px)] flex bg-background">
            {/* Conversations Sidebar */}
            <div className="w-80 border-l border-border flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold font-vazir">پیام‌ها</h2>
                        <Button
                            size="sm"
                            onClick={() => setShowNewChat(true)}
                            className="font-vazir"
                        >
                            <Plus className="w-4 h-4 ml-1" />
                            جدید
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="جستجو در مکالمات..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10 font-vazir"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <ScrollArea className="flex-1">
                    <div className="space-y-1 p-2">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="animate-pulse p-3 rounded-lg">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-muted rounded w-3/4"></div>
                                            <div className="h-3 bg-muted rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : filteredConversations.length > 0 ? (
                            filteredConversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${activeConversation?.id === conversation.id ? 'bg-muted' : ''
                                        }`}
                                    onClick={() => setActiveConversation(conversation)}
                                >
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                        <div className="relative">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={getConversationAvatar(conversation)} />
                                                <AvatarFallback className="font-vazir">
                                                    {getConversationInitials(conversation)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {conversation.type === 'direct' && (
                                                <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium font-vazir truncate">
                                                    {getConversationTitle(conversation)}
                                                </h3>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTime(conversation.last_message_at)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-sm text-muted-foreground font-vazir truncate">
                                                    {conversation.last_message?.content || 'هنوز پیامی ارسال نشده'}
                                                </p>
                                                {conversation.unread_count && conversation.unread_count > 0 && (
                                                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0">
                                                        {conversation.unread_count}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-lg font-semibold font-vazir">مکالمه‌ای یافت نشد</h3>
                                <p className="mt-1 text-muted-foreground font-vazir">
                                    برای شروع مکالمه جدید دکمه "جدید" را بزنید
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={getConversationAvatar(activeConversation)} />
                                        <AvatarFallback className="font-vazir">
                                            {getConversationInitials(activeConversation)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold font-vazir">
                                            {getConversationTitle(activeConversation)}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-vazir">
                                            {activeConversation.type === 'group'
                                                ? `${activeConversation.participants.length} عضو`
                                                : 'آنلاین'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Button variant="ghost" size="sm">
                                        <Phone className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Video className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {messages.map((message, index) => {
                                    const isOwnMessage = message.sender_id === '1'; // Should use actual user ID
                                    const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex items-end space-x-2 space-x-reverse max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                                {!isOwnMessage && showAvatar && (
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarImage src={message.sender.avatar_url} />
                                                        <AvatarFallback className="text-xs font-vazir">
                                                            {message.sender.name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                {!isOwnMessage && !showAvatar && (
                                                    <div className="w-6"></div>
                                                )}

                                                <div
                                                    className={`rounded-lg px-3 py-2 ${isOwnMessage
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted'
                                                        }`}
                                                >
                                                    {!isOwnMessage && showAvatar && (
                                                        <p className="text-xs font-medium font-vazir mb-1">
                                                            {message.sender.name}
                                                        </p>
                                                    )}

                                                    <p className="text-sm font-vazir whitespace-pre-wrap">
                                                        {message.content}
                                                    </p>

                                                    <div className={`flex items-center justify-end space-x-1 space-x-reverse mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                                        }`}>
                                                        <span className="text-xs">
                                                            {formatTime(message.sent_at)}
                                                        </span>
                                                        {isOwnMessage && (
                                                            <CheckCheck className="w-3 h-3" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Message Input */}
                        <div className="p-4 border-t border-border">
                            <div className="flex items-end space-x-2 space-x-reverse">
                                <Button variant="ghost" size="sm">
                                    <Paperclip className="w-4 h-4" />
                                </Button>

                                <div className="flex-1 relative">
                                    <Textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="پیام خود را بنویسید..."
                                        className="resize-none font-vazir min-h-[40px] max-h-32"
                                        disabled={sending}
                                    />
                                </div>

                                <Button variant="ghost" size="sm">
                                    <Smile className="w-4 h-4" />
                                </Button>

                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || sending}
                                    size="sm"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold font-vazir">مکالمه‌ای انتخاب کنید</h3>
                            <p className="mt-2 text-muted-foreground font-vazir">
                                برای شروع گفتگو، یکی از مکالمات را انتخاب کنید
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-vazir">مکالمه جدید</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowNewChat(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-medium font-vazir">انتخاب کاربران:</h4>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {users
                                        .filter(user => user.id !== '1') // Don't show current user
                                        .map((user) => (
                                            <label key={user.id} className="flex items-center space-x-3 space-x-reverse p-2 rounded-lg hover:bg-muted cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedUsers(prev => [...prev, user.id]);
                                                        } else {
                                                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={user.avatar_url} />
                                                    <AvatarFallback className="font-vazir text-sm">
                                                        {user.name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium font-vazir">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </label>
                                        ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 space-x-reverse">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowNewChat(false)}
                                    className="font-vazir"
                                >
                                    لغو
                                </Button>
                                <Button
                                    onClick={handleCreateConversation}
                                    disabled={selectedUsers.length === 0}
                                    className="font-vazir"
                                >
                                    ایجاد مکالمه
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}