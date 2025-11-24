import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MessageSquare, Globe, Bot, User, AlertCircle } from 'lucide-react';
import { ChatStatus, Channel } from '@/types';
import { cn } from '@/lib/utils';
import { ChatDetail } from '@/components/chats/ChatDetail';
import { useChats } from '@/hooks/useChats';
import { useMessages } from '@/hooks/useMessages';

export default function Chats() {
  const { data: chats = [], isLoading } = useChats();
  const [selectedTab, setSelectedTab] = useState<'all' | 'needs-action' | 'resolved'>('all');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all');
  const { data: messages = [] } = useMessages(selectedChatId);

  const filteredChats = chats.filter(chat => {
    // Tab filter
    if (selectedTab === 'needs-action' && chat.status !== 'needs_action') return false;
    if (selectedTab === 'resolved' && chat.status !== 'resolved') return false;
    
    // Channel filter
    if (channelFilter !== 'all' && chat.channel !== channelFilter) return false;
    
    // Search filter
    if (searchQuery && !chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const selectedChat = chats.find(c => c.id === selectedChatId);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-4">
      {/* Left Column: Filters */}
      <div className="w-64 space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Filters</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Channel</label>
              <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as Channel | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="web">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Legend</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-success" />
              <span className="text-muted-foreground">WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Website</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">AI Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Admin Mode</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Middle Column: Chat List */}
      <div className="w-96 flex flex-col bg-card rounded-lg border">
        <div className="p-4 border-b">
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All Chats</TabsTrigger>
              <TabsTrigger value="needs-action" className="flex-1">
                Needs Action
                {chats.filter(c => c.status === 'needs_action').length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                    {chats.filter(c => c.status === 'needs_action').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-2" />
              <p>No chats found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredChats.map((chat) => {
                const isSelected = chat.id === selectedChatId;
                const ChannelIcon = chat.channel === 'whatsapp' ? MessageSquare : Globe;
                const ModeIcon = chat.mode === 'ai' ? Bot : User;
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={cn(
                      'w-full p-4 text-left hover:bg-muted/50 transition-colors',
                      isSelected && 'bg-muted'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">
                          {chat.customerName.charAt(0)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{chat.customerName}</span>
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {new Date(chat.lastMessageTime).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {chat.lastMessage}
                        </p>
                        
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ChannelIcon className={cn(
                            'w-3.5 h-3.5',
                            chat.channel === 'whatsapp' ? 'text-success' : 'text-primary'
                          )} />
                          <ModeIcon className={cn(
                            'w-3.5 h-3.5',
                            chat.mode === 'ai' ? 'text-muted-foreground' : 'text-accent'
                          )} />
                          {chat.escalated && (
                            <AlertCircle className="w-3.5 h-3.5 text-accent" />
                          )}
                          {chat.unreadCount > 0 && (
                            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Chat Detail */}
      <div className="flex-1">
        {selectedChat ? (
          <ChatDetail chat={selectedChat} messages={messages} />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a chat to view details</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
