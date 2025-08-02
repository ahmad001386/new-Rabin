'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Send, MessageCircle, Circle } from 'lucide-react';

// Define proper TypeScript interfaces
interface User {
    id: string;
    name: string;
    role?: string;
    status: 'online' | 'away' | 'offline';
}

interface Contact {
    id: string;
    name: string;
    status: 'online' | 'away' | 'offline';
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    timestamp: Date;
    status: 'sent' | 'delivered' | 'read';
}

// Mock data
const mockUsers: User[] = [
    { id: '1', name: 'شما', role: 'مدیر فروش', status: 'online' },
    { id: '2', name: 'علی رضایی', role: 'توسعه دهنده', status: 'online' },
];

const mockContacts: Contact[] = [
    { id: '3', name: 'سارا محمدی', status: 'away' },
    { id: '4', name: 'امیر حسینی', status: 'offline' },
];

const mockMessages: Message[] = [
    {
        id: '1',
        content: 'سلام، گزارش فروش این ماه آماده شد؟',
        senderId: '1',
        receiverId: '2',
        timestamp: new Date('2025-07-16T10:00:00'),
        status: 'read',
    },
    {
        id: '2',
        content: 'بله، تا ساعت ۲ براتون ارسال می‌کنم',
        senderId: '2',
        receiverId: '1',
        timestamp: new Date('2025-07-16T10:01:00'),
        status: 'read',
    },
];

function ChatApp() {
    const [contacts] = useState<(User | Contact)[]>([...mockUsers, ...mockContacts]);
    const [selectedContact, setSelectedContact] = useState<User | Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>(mockMessages);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        return () => {
            setMessages([]);
            setSelectedContact(null);
            setNewMessage('');
            setSearchTerm('');
        };
    }, []);

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact as User).role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentUserMessages = selectedContact
        ? messages.filter(msg =>
            (msg.senderId === '1' && msg.receiverId === selectedContact.id) ||
            (msg.receiverId === '1' && msg.senderId === selectedContact.id)
        )
        : [];

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedContact) return;

        const message: Message = {
            id: (messages.length + 1).toString(),
            content: newMessage,
            senderId: '1',
            receiverId: selectedContact.id,
            timestamp: new Date(),
            status: 'sent',
        };

        setMessages([...messages, message]);
        setNewMessage('');
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        چت سازمانی
                    </h1>
                    <p className="text-muted-foreground font-vazir mt-2">گفتگو با همکاران و مخاطبین</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
                {/* Contacts List */}
                <Card className="col-span-12 lg:col-span-4 h-full">
                    <CardHeader>
                        <div className="relative">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="جستجوی مخاطب..."
                                className="pl-3 pr-10 font-vazir"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                dir="rtl"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[calc(100vh-16rem)]">
                            <div className="space-y-2">
                                {filteredContacts.map(contact => (
                                    <div
                                        key={contact.id}
                                        className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg cursor-pointer transition-all duration-300 ${selectedContact?.id === contact.id
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-muted/50'
                                            }`}
                                        onClick={() => setSelectedContact(contact)}
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 text-primary font-vazir">
                                                {contact.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium font-vazir truncate">{contact.name}</p>
                                                {'role' in contact && contact.role && (
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                                        {contact.role}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2 space-x-reverse text-xs text-muted-foreground mt-1">
                                                <Circle className={`h-2 w-2 ${contact.status === 'online'
                                                    ? 'fill-green-500 text-green-500'
                                                    : contact.status === 'away'
                                                        ? 'fill-yellow-500 text-yellow-500'
                                                        : 'fill-gray-500 text-gray-500'
                                                    }`} />
                                                <span className="font-vazir">
                                                    {contact.status === 'online'
                                                        ? 'آنلاین'
                                                        : contact.status === 'away'
                                                            ? 'غایب'
                                                            : 'آفلاین'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="col-span-12 lg:col-span-8 h-full">
                    {selectedContact ? (
                        <>
                            <CardHeader className="border-b">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-primary/10 text-primary font-vazir">
                                            {selectedContact.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="font-vazir">{selectedContact.name}</CardTitle>
                                        {'role' in selectedContact && selectedContact.role && (
                                            <p className="text-sm text-muted-foreground font-vazir">
                                                {selectedContact.role}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex flex-col h-[calc(100vh-20rem)]">
                                <ScrollArea className="flex-1 p-4">
                                    <div className="space-y-4">
                                        {currentUserMessages.map(message => (
                                            <div
                                                key={message.id}
                                                className={`flex items-start gap-2 ${message.senderId === '1'
                                                    ? 'flex-row-reverse'
                                                    : 'flex-row'
                                                    }`}
                                            >
                                                <Avatar className="h-8 w-8 mt-1">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-vazir">
                                                        {message.senderId === '1'
                                                            ? 'من'
                                                            : selectedContact.name.split(' ').map(n => n[0]).join('')
                                                        }
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div
                                                    className={`rounded-2xl p-3 max-w-[80%] ${message.senderId === '1'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted'
                                                        }`}
                                                >
                                                    <p className="text-sm font-vazir">{message.content}</p>
                                                    <span className="text-xs opacity-70 mt-1 block font-vazir text-right">
                                                        {new Date(message.timestamp).toLocaleTimeString('fa-IR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="p-4 border-t">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <Input
                                            placeholder="پیام خود را بنویسید..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            className="font-vazir"
                                            dir="rtl"
                                        />
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                            size="icon"
                                            className="shrink-0"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                                <p className="font-vazir">یک مخاطب را برای شروع گفتگو انتخاب کنید</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default function Page() {
    return <ChatApp />;
}