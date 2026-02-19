// import { useState } from 'react';
// import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Card } from '@/components/ui/card';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Search, MessageSquare, Globe, Bot, User, AlertCircle } from 'lucide-react';
// import { ChatStatus, Channel } from '@/types';
// import { cn } from '@/lib/utils';
// import { ChatDetail } from '@/components/chats/ChatDetail';
// import { useChats } from '@/hooks/useChats';
// import { useMessages } from '@/hooks/useMessages';

// type MainTabValue = 'all' | 'ai' | 'ongoing' | 'resolved';
// type AISubTab = 'all_ai' | 'needs_action';
// type OngoingSubTab = 'all' | 'unread';

// export default function Chats() {
//   const { data: chats = [], isLoading, resetUnread } = useChats();
//   const [selectedTab, setSelectedTab] = useState<MainTabValue>('all');
//   const [aiSubTab, setAISubTab] = useState<AISubTab>('all_ai');
//   const [ongoingSubTab, setOngoingSubTab] = useState<OngoingSubTab>('all');
//   const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all');
//   const { data: messages = [] } = useMessages(selectedChatId);

//   const filteredChats = chats.filter(chat => {
//     // Main tab filter
//     if (selectedTab === 'all') {
//       // Show all chats
//     } else if (selectedTab === 'ai') {
//       // Filter based on sub-tab
//       if (aiSubTab === 'all_ai') {
//         // Show all AI chats (status = 'ai')
//         if (chat.current_status !== 'ai') return false;
//       } else if (aiSubTab === 'needs_action') {
//         // Show only needs_action chats
//         if (chat.current_status !== 'needs_action') return false;
//       }
//     } else if (selectedTab === 'ongoing') {
//       // Show ongoing chats (status = 'human')
//       if (chat.current_status !== 'human') return false;
      
//       // Filter based on sub-tab
//       if (ongoingSubTab === 'unread') {
//         // Show only unread ongoing chats
//         if (chat.unreadCount === 0) return false;
//       }
//     } else if (selectedTab === 'resolved') {
//       // Show resolved chats
//       if (chat.current_status !== 'resolved') return false;
//     }
    
//     // Channel filter
//     if (channelFilter !== 'all' && chat.channel !== channelFilter) return false;
    
//     // Search filter
//     if (searchQuery && !chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
//         !chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())) {
//       return false;
//     }
    
//     return true;
//   });

//   const selectedChat = chats.find(c => c.id === selectedChatId);

//   // Count chats per status
//   const countAllChats = chats.length;
//   const countNeedsAction = chats.filter(c => c.current_status === 'needs_action').length;
//   const countOngoing = chats.filter(c => c.current_status === 'human').length;
//   const countOngoingUnread = chats.filter(c => c.current_status === 'human' && c.unreadCount > 0).length;
//   const countResolved = chats.filter(c => c.current_status === 'resolved').length;
//   const countAllAI = chats.filter(c => c.current_status === 'ai').length;

//   if (isLoading) {
//     return <div className="flex items-center justify-center h-screen">Loading...</div>;
//   }

//   return (
//     <div className="h-[calc(100vh-2rem)] flex gap-4">
//       {/* Left Column: Filters */}
//       <div className="w-64 space-y-4">
//         <Card className="p-4">
//           <h3 className="font-semibold mb-3">Filters</h3>
//           <div className="space-y-3">
//             <div>
//               <label className="text-sm text-muted-foreground mb-1.5 block">Channel</label>
//               <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as Channel | 'all')}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Channels</SelectItem>
//                   <SelectItem value="whatsapp">WhatsApp</SelectItem>
//                   <SelectItem value="web">Website</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
            
//             <div>
//               <label className="text-sm text-muted-foreground mb-1.5 block">Search</label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                 <Input
//                   placeholder="Search chats..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-9"
//                 />
//               </div>
//             </div>
//           </div>
//         </Card>

//         <Card className="p-4">
//           <h3 className="font-semibold mb-2">Legend</h3>
//           <div className="space-y-2 text-sm">
//             <div className="flex items-center gap-2">
//               <MessageSquare className="w-4 h-4 text-success" />
//               <span className="text-muted-foreground">WhatsApp</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Globe className="w-4 h-4 text-primary" />
//               <span className="text-muted-foreground">Website</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Bot className="w-4 h-4 text-muted-foreground" />
//               <span className="text-muted-foreground">AI Mode</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <User className="w-4 h-4 text-accent" />
//               <span className="text-muted-foreground">Admin Mode</span>
//             </div>
//           </div>
//         </Card>
//       </div>

//       {/* Middle Column: Chat List */}
//       <div className="w-96 flex flex-col bg-card rounded-lg border">
//         <div className="p-4 border-b space-y-3">
//           <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as MainTabValue)}>
//             <TabsList className="w-full grid grid-cols-4">
//               <TabsTrigger value="all" className="text-xs px-2">
//                 All Chats
//                 {countAllChats > 0 && (
//                   <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
//                     {countAllChats}
//                   </Badge>
//                 )}
//               </TabsTrigger>
//               <TabsTrigger value="ai" className="text-xs px-2">
//                 AI
//                 {(countAllAI + countNeedsAction) > 0 && (
//                   <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
//                     {countAllAI + countNeedsAction}
//                   </Badge>
//                 )}
//               </TabsTrigger>
//               <TabsTrigger value="ongoing" className="text-xs px-2">
//                 Ongoing
//                 {countOngoing > 0 && (
//                   <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
//                     {countOngoing}
//                   </Badge>
//                 )}
//               </TabsTrigger>
//               <TabsTrigger value="resolved" className="text-xs px-2">
//                 Resolved
//                 {countResolved > 0 && (
//                   <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
//                     {countResolved}
//                   </Badge>
//                 )}
//               </TabsTrigger>
//             </TabsList>
//           </Tabs>

//           {/* Sub-filters for AI */}
//           {selectedTab === 'ai' && (
//             <Tabs value={aiSubTab} onValueChange={(v) => setAISubTab(v as AISubTab)}>
//               <TabsList className="w-full grid grid-cols-2">
//                 <TabsTrigger value="all_ai" className="text-xs px-2">
//                   All
//                   {countAllAI > 0 && (
//                     <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
//                       {countAllAI}
//                     </Badge>
//                   )}
//                 </TabsTrigger>
//                 <TabsTrigger value="needs_action" className="text-xs px-2">
//                   Needs Action
//                   {countNeedsAction > 0 && (
//                     <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
//                       {countNeedsAction}
//                     </Badge>
//                   )}
//                 </TabsTrigger>
//               </TabsList>
//             </Tabs>
//           )}

//           {/* Sub-filters for Ongoing */}
//           {selectedTab === 'ongoing' && (
//             <Tabs value={ongoingSubTab} onValueChange={(v) => setOngoingSubTab(v as OngoingSubTab)}>
//               <TabsList className="w-full grid grid-cols-2">
//                 <TabsTrigger value="all" className="text-xs px-2">
//                   All
//                   {countOngoing > 0 && (
//                     <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
//                       {countOngoing}
//                     </Badge>
//                   )}
//                 </TabsTrigger>
//                 <TabsTrigger value="unread" className="text-xs px-2">
//                   Unread
//                   {countOngoingUnread > 0 && (
//                     <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
//                       {countOngoingUnread}
//                     </Badge>
//                   )}
//                 </TabsTrigger>
//               </TabsList>
//             </Tabs>
//           )}
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {filteredChats.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
//               <MessageSquare className="w-12 h-12 mb-2" />
//               <p>No chats found</p>
//             </div>
//           ) : (
//             <div className="divide-y">
//               {filteredChats.map((chat) => {
//                 const isSelected = chat.id === selectedChatId;
//                 const ChannelIcon = chat.channel === 'whatsapp' ? MessageSquare : Globe;
//                 const ModeIcon = chat.mode === 'ai' ? Bot : User;
                
//                 return (
//                   <button
//                     key={chat.id}
//                     onClick={async () => {
//                       await resetUnread(chat.id)
//                       setSelectedChatId(chat.id)
//                     }}
//                     className={cn(
//                       'w-full p-4 text-left hover:bg-muted/50 transition-colors',
//                       isSelected && 'bg-muted'
//                     )}
//                   >
//                     <div className="flex items-start gap-3">
//                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                         <span className="text-sm font-medium text-primary">
//                           {chat.customerName.charAt(0)}
//                         </span>
//                       </div>
                      
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center justify-between mb-1">
//                           <span className="font-medium truncate">{chat.customerName}</span>
//                           <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
//                             {new Date(chat.lastMessageTime).toLocaleTimeString('en-US', { 
//                               hour: '2-digit', 
//                               minute: '2-digit' 
//                             })}
//                           </span>
//                         </div>
                        
//                         <p className="text-sm text-muted-foreground truncate mb-2">
//                           {chat.lastMessage}
//                         </p>
                        
//                         <div className="flex items-center gap-1.5 flex-wrap">
//                           <ChannelIcon className={cn(
//                             'w-3.5 h-3.5',
//                             chat.channel === 'whatsapp' ? 'text-success' : 'text-primary'
//                           )} />
//                           <ModeIcon className={cn(
//                             'w-3.5 h-3.5',
//                             chat.mode === 'ai' ? 'text-muted-foreground' : 'text-accent'
//                           )} />
//                           {chat.escalated && (
//                             <AlertCircle className="w-3.5 h-3.5 text-accent" />
//                           )}
//                           {chat.unreadCount > 0 && (
//                             <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
//                               {chat.unreadCount}
//                             </Badge>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Right Column: Chat Detail */}
//       <div className="flex-1">
//         {selectedChat ? (
//           <ChatDetail chat={selectedChat} messages={messages} />
//         ) : (
//           <Card className="h-full flex items-center justify-center">
//             <div className="text-center text-muted-foreground">
//               <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
//               <p>Select a chat to view details</p>
//             </div>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }












// import { useState, useEffect } from 'react';
// import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Card } from '@/components/ui/card';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Search, MessageSquare, Globe, Bot, User, AlertCircle } from 'lucide-react';
// import { ChatStatus, Channel } from '@/types';
// import { cn } from '@/lib/utils';
// import { ChatDetail } from '@/components/chats/ChatDetail';
// import { useChats } from '@/hooks/useChats';
// import { useMessages } from '@/hooks/useMessages';

// type MainTabValue = 'all' | 'ai' | 'ongoing' | 'resolved';
// type AISubTab = 'all_ai' | 'needs_action';
// type OngoingSubTab = 'all' | 'unread';

// export default function Chats() {
//   const { data: chats = [], isLoading, resetUnread } = useChats();
//   const [selectedTab, setSelectedTab] = useState<MainTabValue>('all');
//   const [aiSubTab, setAISubTab] = useState<AISubTab>('all_ai');
//   const [ongoingSubTab, setOngoingSubTab] = useState<OngoingSubTab>('all');
//   const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all');
//   const { data: messages = [] } = useMessages(selectedChatId);

//   const selectedChat = chats.find(c => c.id === selectedChatId);

//   // ✅ AUTO SYNC TAB BASED ON STATUS (ONLY ADDITION)
//   useEffect(() => {
//     if (!selectedChat) return;

//     if (
//       selectedChat.current_status === 'ai' ||
//       selectedChat.current_status === 'needs_action'
//     ) {
//       setSelectedTab('ai');
//     } else if (selectedChat.current_status === 'human') {
//       setSelectedTab('ongoing');
//     } else if (selectedChat.current_status === 'resolved') {
//       setSelectedTab('resolved');
//     }
//   }, [selectedChat?.current_status]);

//   const filteredChats = chats.filter(chat => {
//     // Main tab filter
//     if (selectedTab === 'all') {
//       // Show all chats
//     } else if (selectedTab === 'ai') {
//       if (aiSubTab === 'all_ai') {
//         if (chat.current_status !== 'ai') return false;
//       } else if (aiSubTab === 'needs_action') {
//         if (chat.current_status !== 'needs_action') return false;
//       }
//     } else if (selectedTab === 'ongoing') {
//       if (chat.current_status !== 'human') return false;
      
//       if (ongoingSubTab === 'unread') {
//         if (chat.unreadCount === 0) return false;
//       }
//     } else if (selectedTab === 'resolved') {
//       if (chat.current_status !== 'resolved') return false;
//     }
    
//     if (channelFilter !== 'all' && chat.channel !== channelFilter) return false;
    
//     if (
//       searchQuery &&
//       !chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
//       !chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
//     ) {
//       return false;
//     }
    
//     return true;
//   });

//   // Count chats per status
//   const countAllChats = chats.length;
//   const countNeedsAction = chats.filter(c => c.current_status === 'needs_action').length;
//   const countOngoing = chats.filter(c => c.current_status === 'human').length;
//   const countOngoingUnread = chats.filter(c => c.current_status === 'human' && c.unreadCount > 0).length;
//   const countResolved = chats.filter(c => c.current_status === 'resolved').length;
//   const countAllAI = chats.filter(c => c.current_status === 'ai').length;

//   if (isLoading) {
//     return <div className="flex items-center justify-center h-screen">Loading...</div>;
//   }

//   return (
//     <div className="h-[calc(100vh-2rem)] flex gap-4">
//       {/* Left Column: Filters */}
//       <div className="w-64 space-y-4">
//         <Card className="p-4">
//           <h3 className="font-semibold mb-3">Filters</h3>
//           <div className="space-y-3">
//             <div>
//               <label className="text-sm text-muted-foreground mb-1.5 block">Channel</label>
//               <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as Channel | 'all')}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Channels</SelectItem>
//                   <SelectItem value="whatsapp">WhatsApp</SelectItem>
//                   <SelectItem value="web">Website</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
            
//             <div>
//               <label className="text-sm text-muted-foreground mb-1.5 block">Search</label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                 <Input
//                   placeholder="Search chats..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-9"
//                 />
//               </div>
//             </div>
//           </div>
//         </Card>

//         <Card className="p-4">
//           <h3 className="font-semibold mb-2">Legend</h3>
//           <div className="space-y-2 text-sm">
//             <div className="flex items-center gap-2">
//               <MessageSquare className="w-4 h-4 text-success" />
//               <span className="text-muted-foreground">WhatsApp</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Globe className="w-4 h-4 text-primary" />
//               <span className="text-muted-foreground">Website</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Bot className="w-4 h-4 text-muted-foreground" />
//               <span className="text-muted-foreground">AI Mode</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <User className="w-4 h-4 text-accent" />
//               <span className="text-muted-foreground">Admin Mode</span>
//             </div>
//           </div>
//         </Card>
//       </div>

//       {/* Middle Column: Chat List */}
//       <div className="w-96 flex flex-col bg-card rounded-lg border">
//         <div className="p-4 border-b space-y-3">
//           <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as MainTabValue)}>
//             <TabsList className="w-full grid grid-cols-4">
//               <TabsTrigger value="all" className="text-xs px-2">
//                 All Chats
//                 {countAllChats > 0 && (
//                   <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
//                     {countAllChats}
//                   </Badge>
//                 )}
//               </TabsTrigger>
//               <TabsTrigger value="ai" className="text-xs px-2">
//                 AI
//                 {(countAllAI + countNeedsAction) > 0 && (
//                   <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
//                     {countAllAI + countNeedsAction}
//                   </Badge>
//                 )}
//               </TabsTrigger>
//               <TabsTrigger value="ongoing" className="text-xs px-2">
//                 Ongoing
//                 {countOngoing > 0 && (
//                   <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
//                     {countOngoing}
//                   </Badge>
//                 )}
//               </TabsTrigger>
//               <TabsTrigger value="resolved" className="text-xs px-2">
//                 Resolved
//                 {countResolved > 0 && (
//                   <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
//                     {countResolved}
//                   </Badge>
//                 )}
//               </TabsTrigger>
//             </TabsList>
//           </Tabs>

//           {selectedTab === 'ai' && (
//             <Tabs value={aiSubTab} onValueChange={(v) => setAISubTab(v as AISubTab)}>
//               <TabsList className="w-full grid grid-cols-2">
//                 <TabsTrigger value="all_ai" className="text-xs px-2">
//                   All
//                   {countAllAI > 0 && (
//                     <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
//                       {countAllAI}
//                     </Badge>
//                   )}
//                 </TabsTrigger>
//                 <TabsTrigger value="needs_action" className="text-xs px-2">
//                   Needs Action
//                   {countNeedsAction > 0 && (
//                     <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
//                       {countNeedsAction}
//                     </Badge>
//                   )}
//                 </TabsTrigger>
//               </TabsList>
//             </Tabs>
//           )}

//           {selectedTab === 'ongoing' && (
//             <Tabs value={ongoingSubTab} onValueChange={(v) => setOngoingSubTab(v as OngoingSubTab)}>
//               <TabsList className="w-full grid grid-cols-2">
//                 <TabsTrigger value="all" className="text-xs px-2">
//                   All
//                   {countOngoing > 0 && (
//                     <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
//                       {countOngoing}
//                     </Badge>
//                   )}
//                 </TabsTrigger>
//                 <TabsTrigger value="unread" className="text-xs px-2">
//                   Unread
//                   {countOngoingUnread > 0 && (
//                     <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
//                       {countOngoingUnread}
//                     </Badge>
//                   )}
//                 </TabsTrigger>
//               </TabsList>
//             </Tabs>
//           )}
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {filteredChats.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
//               <MessageSquare className="w-12 h-12 mb-2" />
//               <p>No chats found</p>
//             </div>
//           ) : (
//             <div className="divide-y">
//               {filteredChats.map((chat) => {
//                 const isSelected = chat.id === selectedChatId;
//                 const ChannelIcon = chat.channel === 'whatsapp' ? MessageSquare : Globe;
//                 const ModeIcon = chat.mode === 'ai' ? Bot : User;
                
//                 return (
//                   <button
//                     key={chat.id}
//                     onClick={async () => {
//                       await resetUnread(chat.id)
//                       setSelectedChatId(chat.id)
//                     }}
//                     className={cn(
//                       'w-full p-4 text-left hover:bg-muted/50 transition-colors',
//                       isSelected && 'bg-muted'
//                     )}
//                   >
//                     <div className="flex items-start gap-3">
//                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                         <span className="text-sm font-medium text-primary">
//                           {chat.customerName.charAt(0)}
//                         </span>
//                       </div>
                      
//                       <div className="flex-1 min-w-0">
                            
//                         {/* <div className="flex items-center justify-between mb-1">
//                           <span className="font-medium truncate">{chat.customerName}</span>
//                           <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
//                             {new Date(chat.lastMessageTime).toLocaleTimeString('en-US', { 
//                               hour: '2-digit', 
//                               minute: '2-digit' 
//                             })}
//                           </span>
//                         </div> */}
                            

//                                           {/* <div className="flex items-start justify-between mb-1">
//                     <div className="min-w-0">
//                       <div className="font-medium truncate">
//                         {chat.contact?.display_name || chat.contact?.phone_number || 'Unknown'}
//                       </div>
                  
//                       {chat.contact?.display_name && (
//                         <div className="text-xs text-muted-foreground truncate">
//                           {chat.contact?.phone_number}
//                         </div>
//                       )}
//                     </div>
                  
//                     <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
//                       {chat.last_message_at
//                         ? new Date(chat.last_message_at).toLocaleTimeString('en-US', {
//                             hour: '2-digit',
//                             minute: '2-digit',
//                           })
//                         : ''}
//                     </span>
//                   </div> */}

                            

//                             <div className="flex items-center justify-between mb-1">
//   <div className="flex flex-col min-w-0">
//     <span className="font-medium truncate">
//       {chat.contact?.display_name || chat.contact?.phone_number || 'Unknown'}
//     </span>

//     {chat.contact?.display_name && (
//       <span className="text-xs text-muted-foreground truncate">
//         {chat.contact?.phone_number}
//       </span>
//     )}
//   </div>

//   <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
//     {chat.lastMessageTime &&
//       new Date(chat.lastMessageTime).toLocaleTimeString('en-US', {
//         hour: '2-digit',
//         minute: '2-digit',
//       })}
//   </span>
// </div>



                            
//                         <p className="text-sm text-muted-foreground truncate mb-2">
//                           {chat.lastMessage}
//                         </p>
                        
//                         <div className="flex items-center gap-1.5 flex-wrap">
//                           <ChannelIcon className={cn(
//                             'w-3.5 h-3.5',
//                             chat.channel === 'whatsapp' ? 'text-success' : 'text-primary'
//                           )} />
//                           <ModeIcon className={cn(
//                             'w-3.5 h-3.5',
//                             chat.mode === 'ai' ? 'text-muted-foreground' : 'text-accent'
//                           )} />
//                           {chat.escalated && (
//                             <AlertCircle className="w-3.5 h-3.5 text-accent" />
//                           )}
//                           {chat.unreadCount > 0 && (
//                             <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
//                               {chat.unreadCount}
//                             </Badge>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Right Column: Chat Detail */}
//       <div className="flex-1">
//         {selectedChat ? (
//           <ChatDetail chat={selectedChat} messages={messages} />
//         ) : (
//           <Card className="h-full flex items-center justify-center">
//             <div className="text-center text-muted-foreground">
//               <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
//               <p>Select a chat to view details</p>
//             </div>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }








import { useState, useEffect } from 'react';
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

type MainTabValue = 'all' | 'ai' | 'ongoing' | 'resolved';
type AISubTab = 'all_ai' | 'needs_action';
type OngoingSubTab = 'all' | 'unread';

export default function Chats() {
  const { data: chats = [], isLoading, resetUnread } = useChats();
  const [selectedTab, setSelectedTab] = useState<MainTabValue>('all');
  const [aiSubTab, setAISubTab] = useState<AISubTab>('all_ai');
  const [ongoingSubTab, setOngoingSubTab] = useState<OngoingSubTab>('all');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all');
  const { data: messages = [] } = useMessages(selectedChatId);

  const selectedChat = chats.find(c => c.id === selectedChatId);

  // Auto sync tab based on status
  useEffect(() => {
    if (!selectedChat) return;

    if (
      selectedChat.current_status === 'ai' ||
      selectedChat.current_status === 'needs_action'
    ) {
      setSelectedTab('ai');
    } else if (selectedChat.current_status === 'human') {
      setSelectedTab('ongoing');
    } else if (selectedChat.current_status === 'resolved') {
      setSelectedTab('resolved');
    }
  }, [selectedChat?.current_status]);

  // ✅ FILTER BY CHANNEL FIRST (NEW)
  const chatsByChannel =
    channelFilter === 'all'
      ? chats
      : chats.filter(chat => chat.channel === channelFilter);

  const filteredChats = chatsByChannel.filter(chat => {
    if (selectedTab === 'ai') {
      if (aiSubTab === 'all_ai' && chat.current_status !== 'ai') return false;
      if (aiSubTab === 'needs_action' && chat.current_status !== 'needs_action') return false;
    } else if (selectedTab === 'ongoing') {
      if (chat.current_status !== 'human') return false;
      if (ongoingSubTab === 'unread' && chat.unreadCount === 0) return false;
    } else if (selectedTab === 'resolved') {
      if (chat.current_status !== 'resolved') return false;
    }

    if (
      searchQuery &&
      !chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // ✅ COUNTS NOW FOLLOW CHANNEL FILTER
  const countAllChats = chatsByChannel.length;

  const countNeedsAction = chatsByChannel.filter(
    c => c.current_status === 'needs_action'
  ).length;

  const countOngoing = chatsByChannel.filter(
    c => c.current_status === 'human'
  ).length;

  const countOngoingUnread = chatsByChannel.filter(
    c => c.current_status === 'human' && c.unreadCount > 0
  ).length;

  const countResolved = chatsByChannel.filter(
    c => c.current_status === 'resolved'
  ).length;

  const countAllAI = chatsByChannel.filter(
    c => c.current_status === 'ai'
  ).length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-4">
      {/* LEFT COLUMN */}
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
      </div>

      {/* MIDDLE COLUMN */}
      <div className="w-96 flex flex-col bg-card rounded-lg border">
        <div className="p-4 border-b space-y-3">
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as MainTabValue)}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all" className="text-xs px-2">
                All Chats
                {countAllChats > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {countAllChats}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="ai" className="text-xs px-2">
                AI
                {(countAllAI + countNeedsAction) > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {countAllAI + countNeedsAction}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="ongoing" className="text-xs px-2">
                Ongoing
                {countOngoing > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {countOngoing}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="resolved" className="text-xs px-2">
                Resolved
                {countResolved > 0 && (
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                    {countResolved}
                  </Badge>
                )}
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
                const ChannelIcon = chat.channel === 'whatsapp' ? MessageSquare : Globe;
                const ModeIcon = chat.mode === 'ai' ? Bot : User;

                return (
                  <button
                    key={chat.id}
                    onClick={async () => {
                      await resetUnread(chat.id);
                      setSelectedChatId(chat.id);
                    }}
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
                          <span className="font-medium truncate">
                            {chat.customerName}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {chat.lastMessageTime &&
                              new Date(chat.lastMessageTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {chat.lastMessage}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ChannelIcon className="w-3.5 h-3.5" />
                          <ModeIcon className="w-3.5 h-3.5" />
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

      {/* RIGHT COLUMN */}
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
