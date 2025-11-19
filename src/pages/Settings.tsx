import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Globe, Copy, Check, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { mockBusiness, mockQuickReplies } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const embedCode = `<script>
  (function(w,d,s,o,f,js,fjs){
    w['VlowchatWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','vcw','https://cdn.vlowchat.ai/widget.js'));
  vcw('init', { businessId: '${mockBusiness.id}' });
</script>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied to clipboard',
      description: 'Widget code has been copied.'
    });
  };

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your changes have been saved successfully.'
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Settings"
        description="Manage your business profile, integrations, and preferences"
      />

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business Profile</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="quick-replies">Quick Replies</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Business Profile */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Update your business details and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input id="business-name" defaultValue={mockBusiness.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Contact Email</Label>
                  <Input id="business-email" type="email" defaultValue={mockBusiness.email} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="business-phone">Contact Phone</Label>
                <Input id="business-phone" defaultValue={mockBusiness.phone} />
              </div>

              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels & Integrations */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-success" />
                WhatsApp Business API
              </CardTitle>
              <CardDescription>
                Connect your WhatsApp Business account to receive messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">Connected to +62 812-3456-7890</p>
                </div>
                <Badge className="bg-success text-success-foreground">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <Button variant="outline">Manage Connection</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Website Chat Widget
              </CardTitle>
              <CardDescription>
                Add a chat widget to your website to capture visitor inquiries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Embed Code</Label>
                <div className="relative mt-2">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {embedCode}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={handleCopyEmbed}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Copy this code and paste it before the closing &lt;/body&gt; tag on your website
                </p>
              </div>
              
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Documentation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                More channels will be available in future updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" disabled>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Telegram
                </Button>
                <Button variant="outline" disabled>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Facebook Messenger
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Replies */}
        <TabsContent value="quick-replies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quick Reply Templates</CardTitle>
                  <CardDescription>
                    Create reusable message templates for faster responses
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockQuickReplies.map((reply) => (
                  <div
                    key={reply.id}
                    className="flex items-start justify-between p-4 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{reply.name}</span>
                        {reply.channel && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {reply.channel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{reply.content}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button size="icon" variant="ghost">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Playbooks</CardTitle>
              <CardDescription>
                Pre-configured AI conversation flows (Read-only in MVP)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Payment Follow-up', 'Order Status Explanation', 'Shipping Inquiry'].map((playbook) => (
                  <div key={playbook} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium">{playbook}</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about important events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Chats</p>
                  <p className="text-sm text-muted-foreground">Get notified when customers start new conversations</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Needs Action Chats</p>
                  <p className="text-sm text-muted-foreground">Alert me when chats require admin attention</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Alerts</p>
                  <p className="text-sm text-muted-foreground">Notify about incoming payment-related messages</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Escalations</p>
                  <p className="text-sm text-muted-foreground">Alert when AI escalates to human agent</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Language & Localization</CardTitle>
              <CardDescription>
                Set your preferred language and timezone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue={mockBusiness.language}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select defaultValue={mockBusiness.timezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Jakarta">WIB (Jakarta)</SelectItem>
                      <SelectItem value="Asia/Makassar">WITA (Makassar)</SelectItem>
                      <SelectItem value="Asia/Jayapura">WIT (Jayapura)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Powered by</span>
                <span className="font-medium">Vlowzy</span>
              </div>
              <div className="flex gap-2">
                <Button variant="link" size="sm" className="h-auto p-0">Terms of Service</Button>
                <Button variant="link" size="sm" className="h-auto p-0">Privacy Policy</Button>
                <Button variant="link" size="sm" className="h-auto p-0">Support</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
