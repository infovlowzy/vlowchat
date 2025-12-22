import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Globe, Copy, Check, ExternalLink, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { workspace, currentWorkspaceId, refetchWorkspace } = useWorkspace();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: workspace?.name || '',
    business_email: workspace?.business_email || '',
    whatsapp_phone_number: workspace?.whatsapp_phone_number || '',
    business_address: workspace?.business_address || '',
    locale: workspace?.locale || 'en',
    timezone: workspace?.timezone || 'Asia/Jakarta',
  });

  const embedCode = `<script>
  (function(w,d,s,o,f,js,fjs){
    w['VlowchatWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','vcw','https://cdn.vlowchat.ai/widget.js'));
  vcw('init', { workspaceId: '${currentWorkspaceId}' });
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

  const handleSave = async () => {
    if (!currentWorkspaceId) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: formData.name,
          business_email: formData.business_email,
          whatsapp_phone_number: formData.whatsapp_phone_number,
          business_address: formData.business_address,
          locale: formData.locale,
          timezone: formData.timezone,
        })
        .eq('id', currentWorkspaceId);

      if (error) throw error;

      await refetchWorkspace();
      
      toast({
        title: 'Settings saved',
        description: 'Your changes have been saved successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Settings"
        description="Manage your workspace profile, integrations, and preferences"
      />

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business Profile</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
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
                  <Input 
                    id="business-name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Contact Email</Label>
                  <Input 
                    id="business-email" 
                    type="email" 
                    value={formData.business_email}
                    onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-phone">WhatsApp Phone Number</Label>
                  <Input 
                    id="whatsapp-phone" 
                    value={formData.whatsapp_phone_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_phone_number: e.target.value })}
                    placeholder="+62 812 3456 7890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-address">Business Address</Label>
                  <Input 
                    id="business-address" 
                    value={formData.business_address}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                  />
                </div>
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
                  <p className="text-sm text-muted-foreground">
                    {workspace?.whatsapp_phone_number 
                      ? `Connected to ${workspace.whatsapp_phone_number}` 
                      : 'Not connected'}
                  </p>
                </div>
                <Badge className={workspace?.whatsapp_phone_number ? "bg-success text-success-foreground" : "bg-muted"}>
                  {workspace?.whatsapp_phone_number ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : 'Not Connected'}
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
                  <p className="font-medium">Incoming Chats</p>
                  <p className="text-sm text-muted-foreground">Get notified when customers start new conversations</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Needs Action</p>
                  <p className="text-sm text-muted-foreground">Alert me when chats require human attention</p>
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
                  <Select 
                    value={formData.locale}
                    onValueChange={(v) => setFormData({ ...formData, locale: v })}
                  >
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
                  <Select 
                    value={formData.timezone}
                    onValueChange={(v) => setFormData({ ...formData, timezone: v })}
                  >
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

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account, all workspaces, chats, messages, and remove all your data
                        from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                        onClick={async () => {
                          setIsDeleting(true);
                          try {
                            const { error } = await supabase.rpc('delete_user_account' as never);
                            if (error) {
                              // Check if it's the sole owner error
                              if (error.message?.includes('sole owner')) {
                                toast({
                                  title: 'Cannot delete account',
                                  description: 'You are the sole owner of one or more workspaces. Please transfer ownership or delete those workspaces first.',
                                  variant: 'destructive',
                                });
                                return;
                              }
                              throw error;
                            }
                            
                            await supabase.auth.signOut();
                            navigate('/auth');
                            toast({
                              title: 'Account deleted',
                              description: 'Your account has been permanently deleted.',
                            });
                          } catch (error) {
                            toast({
                              title: 'Error',
                              description: 'Failed to delete account. Please try again.',
                              variant: 'destructive',
                            });
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
