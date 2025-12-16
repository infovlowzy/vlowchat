import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, MessageSquare, Bot, User, AlertCircle } from 'lucide-react';
import { ChatStatus } from '@/types';
import { cn } from '@/lib/utils';
import { ChatDetail } from '@/components/chats/ChatDetail';
import { useChats } from '@/hooks/useChats';
import { useMessages } from '@/hooks/useMessages';

type TabValue = 'ai' | 'needs_action' | 'human' | 'resolved';

export default function Chats() {
  const [selectedTab, setSelectedTab] = useState<TabValue>('needs_action');
  const { data: chats = [], isLoading } = useChats(selectedTab as ChatStatus);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: messages = [] } = useMessages(selectedChatId);

  // Count for badges - fetch all chats to get counts
  const { data: allChats = [] } = useChats();

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const contactName = chat.contact?.display_name || chat.contact?.phone_number || '';
    return contactName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedChat = chats.find(c => c.id === selectedChatId);

  const getTabCount = (status: ChatStatus) => {
    return allChats.filter(c => c.current_status === status).length;
  };

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
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">AI Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Human Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-muted-foreground">Needs Action</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Middle Column: Chat List */}
      <div className="w-96 flex flex-col bg-card rounded-lg border">
        <div className="p-4 border-b">
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as TabValue)}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="ai" className="text-xs px-2">
                AI
                {getTabCount('ai') > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {getTabCount('ai')}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="needs_action" className="text-xs px-2">
                Needs Action
                {getTabCount('needs_action') > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
                    {getTabCount('needs_action')}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="human" className="text-xs px-2">
                Human
                {getTabCount('human') > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {getTabCount('human')}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved" className="text-xs px-2">
                Resolved
              </TabsTrigger>
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
                const contactName = chat.contact?.display_name || chat.contact?.phone_number || 'Unknown';
                const StatusIcon = chat.current_status === 'ai' || chat.current_status === 'resolved' ? Bot : User;
                
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
                          {contactName.charAt(0)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{contactName}</span>
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {chat.last_message_at && new Date(chat.last_message_at).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusIcon className={cn(
                            'w-3.5 h-3.5',
                            chat.current_status === 'ai' || chat.current_status === 'resolved' ? 'text-primary' : 'text-accent'
                          )} />
                          {chat.current_status === 'needs_action' && (
                            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                          )}
                          {(chat.unread_count_for_human || 0) > 0 && (
                            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                              {chat.unread_count_for_human}
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
