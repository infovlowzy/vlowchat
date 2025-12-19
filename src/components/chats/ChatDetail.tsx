import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, User, Send, Smile, Paperclip, Check, AlertCircle } from 'lucide-react';
import { Chat, Message } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSendMessage, useUpdateChatStatus } from '@/hooks/useMessages';

interface ChatDetailProps {
  chat: Chat;
  messages: Message[];
}

export function ChatDetail({ chat, messages }: ChatDetailProps) {
  const [messageText, setMessageText] = useState('');
  const { toast } = useToast();
  const sendMessage = useSendMessage();
  const updateChatStatus = useUpdateChatStatus();
  
  const contactName = chat.contact?.display_name || chat.contact?.phone_number || 'Unknown';
  const isHumanMode = chat.current_status === 'human';

  const handleTakeOver = async () => {
    try {
      await updateChatStatus.mutateAsync({
        chatId: chat.id,
        status: 'human',
      });
      toast({
        title: 'Admin mode activated',
        description: 'You are now replying as admin. AI is paused.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to take over chat',
        variant: 'destructive'
      });
    }
  };

  const handleResolve = async () => {
    try {
      await updateChatStatus.mutateAsync({
        chatId: chat.id,
        status: 'resolved',
      });
      toast({
        title: 'Chat resolved',
        description: 'Returning control to AI automated replies.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve chat',
        variant: 'destructive'
      });
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !chat.contact_id) return;
    
    try {
      await sendMessage.mutateAsync({
        chatId: chat.id,
        contactId: chat.contact_id,
        text: messageText,
      });
      setMessageText('');
      toast({
        title: 'Message sent',
        description: 'Your message has been delivered.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {contactName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{contactName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {chat.contact?.phone_number || 'No phone'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isHumanMode ? 'default' : 'secondary'} className="gap-1">
              {isHumanMode ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              {isHumanMode ? 'Human Control' : chat.current_status === 'ai' ? 'AI Automated' : chat.current_status.replace('_', ' ')}
            </Badge>
            <Badge variant={chat.current_status === 'needs_action' ? 'destructive' : 'outline'}>
              {chat.current_status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isHumanMode && chat.current_status !== 'resolved' && (
            <Button onClick={handleTakeOver} size="sm" variant="outline" disabled={updateChatStatus.isPending}>
              <User className="w-4 h-4 mr-2" />
              Take Over as Admin
            </Button>
          )}
          
          {chat.current_status !== 'resolved' && (
            <Button onClick={handleResolve} size="sm" disabled={updateChatStatus.isPending}>
              <Check className="w-4 h-4 mr-2" />
              Resolve (Return to AI)
            </Button>
          )}
        </div>

        {/* Human Mode Banner */}
        {isHumanMode && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              AI is paused. You are now replying as human.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet</p>
          </div>
        ) : (
          messages.map((message) => {
            const isInbound = message.direction === 'inbound';
            const isAI = message.sender_type === 'ai';
            
            return (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  isInbound ? 'justify-start' : 'justify-end'
                )}
              >
                {isInbound && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">
                      {contactName.charAt(0)}
                    </span>
                  </div>
                )}
                
                <div className={cn('flex flex-col gap-1', isInbound ? 'items-start' : 'items-end')}>
                  {!isInbound && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {isAI ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      <span>{isAI ? 'AI Bot' : 'Human'}</span>
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2 max-w-md',
                      isInbound
                        ? 'bg-muted'
                        : isAI
                        ? 'bg-primary/10 text-foreground'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text || ''}</p>
                  </div>
                  
                  <span className="text-xs text-muted-foreground">
                    {message.created_at && new Date(message.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {!isInbound && (
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
          })
        )}
      </div>

      {/* Meta Info */}
      <div className="px-4 py-3 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Contact: {chat.contact?.phone_number || 'Unknown'}</span>
            {chat.contact?.last_seen_at && (
              <span>Last seen: {new Date(chat.contact.last_seen_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t space-y-2">
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
            <Button size="icon" onClick={handleSend} disabled={sendMessage.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
