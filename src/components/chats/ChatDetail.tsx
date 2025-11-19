import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Globe, Bot, User, Send, Smile, Paperclip, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { Chat, Message } from '@/types';
import { cn } from '@/lib/utils';
import { mockQuickReplies } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

interface ChatDetailProps {
  chat: Chat;
  messages: Message[];
}

export function ChatDetail({ chat, messages }: ChatDetailProps) {
  const [messageText, setMessageText] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(chat.mode === 'admin');
  const { toast } = useToast();
  
  const ChannelIcon = chat.channel === 'whatsapp' ? MessageSquare : Globe;

  const handleTakeOver = () => {
    setIsAdminMode(true);
    toast({
      title: 'Admin mode activated',
      description: 'You are now replying as admin. AI is paused.'
    });
  };

  const handleResolve = () => {
    setIsAdminMode(false);
    toast({
      title: 'Chat resolved',
      description: 'Returning control to AI automated replies.'
    });
  };

  const handleSend = () => {
    if (!messageText.trim()) return;
    
    toast({
      title: 'Message sent',
      description: 'Your message has been delivered.'
    });
    setMessageText('');
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {chat.customerName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">{chat.customerName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <ChannelIcon className={cn(
                  'w-3.5 h-3.5',
                  chat.channel === 'whatsapp' ? 'text-success' : 'text-primary'
                )} />
                <span className="text-xs text-muted-foreground capitalize">
                  {chat.channel}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isAdminMode ? 'default' : 'secondary'} className="gap-1">
              {isAdminMode ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              {isAdminMode ? 'Admin Control' : 'AI Automated'}
            </Badge>
            <Badge variant={chat.status === 'needs_action' ? 'destructive' : 'outline'}>
              {chat.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isAdminMode && chat.status !== 'resolved' && (
            <Button onClick={handleTakeOver} size="sm" variant="outline">
              <User className="w-4 h-4 mr-2" />
              Take Over as Admin
            </Button>
          )}
          
          {chat.status === 'needs_action' && (
            <Button onClick={handleResolve} size="sm">
              <Check className="w-4 h-4 mr-2" />
              Resolve (Return to AI)
            </Button>
          )}
          
          {chat.paymentRelated && (
            <Button size="sm" variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              View in Transactions
            </Button>
          )}
        </div>

        {/* Admin Mode Banner */}
        {isAdminMode && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vlowchat AI is paused. You are now replying as admin.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isCustomer = message.sender === 'customer';
          const isAI = message.sender === 'ai';
          
          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                isCustomer ? 'justify-start' : 'justify-end'
              )}
            >
              {isCustomer && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium">
                    {chat.customerName.charAt(0)}
                  </span>
                </div>
              )}
              
              <div className={cn('flex flex-col gap-1', isCustomer ? 'items-start' : 'items-end')}>
                {!isCustomer && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {isAI ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    <span>{isAI ? 'AI Bot' : 'Admin'}</span>
                  </div>
                )}
                
                <div
                  className={cn(
                    'rounded-lg px-4 py-2 max-w-md',
                    isCustomer
                      ? 'bg-muted'
                      : isAI
                      ? 'bg-primary/10 text-foreground'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                <span className="text-xs text-muted-foreground">
                  {new Date(message.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {!isCustomer && (
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  isAI ? 'bg-primary/10' : 'bg-accent/10'
                )}>
                  {isAI ? (
                    <Bot className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-accent" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Meta Info */}
      <div className="px-4 py-3 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>First seen: {new Date(chat.firstSeen).toLocaleDateString()}</span>
            <span>Total chats: {chat.totalChats}</span>
          </div>
          {chat.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {chat.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t space-y-2">
        <div className="flex items-center gap-2">
          <Select value="" onValueChange={(value) => setMessageText(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Quick replies" />
            </SelectTrigger>
            <SelectContent>
              {mockQuickReplies.map((reply) => (
                <SelectItem key={reply.id} value={reply.content}>
                  {reply.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button size="icon" variant="outline">
              <Smile className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button size="icon" onClick={handleSend}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
