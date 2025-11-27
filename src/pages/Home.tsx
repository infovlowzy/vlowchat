import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, AlertCircle, Receipt, TrendingUp, Activity, CheckCircle2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type ViewType = 'daily' | 'weekly' | 'monthly';

export default function Home() {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [viewType, setViewType] = useState<ViewType>('weekly');
  const [selectedPeriod, setSelectedPeriod] = useState(0); // 0 = current period, -1 = last period, etc.

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
  });

  // Fetch real chat data based on view type and period
  const { data: chatData } = useQuery({
    queryKey: ["analytics", viewType, selectedPeriod],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];

      let startDate: Date;
      let endDate: Date;
      const now = new Date();

      // Calculate date range based on view type and selected period
      if (viewType === 'daily') {
        // For daily view, show last 24 hours in 4-hour chunks
        const daysOffset = Math.abs(selectedPeriod);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysOffset);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      } else if (viewType === 'weekly') {
        // For weekly view, show 7 days
        const weeksOffset = Math.abs(selectedPeriod);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (weeksOffset * 7) - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (weeksOffset * 7) + 1);
        endDate.setHours(0, 0, 0, 0);
      } else {
        // For monthly view, show 12 months
        const yearsOffset = Math.abs(selectedPeriod);
        startDate = new Date(now.getFullYear() - yearsOffset, 0, 1);
        endDate = new Date(now.getFullYear() - yearsOffset + 1, 0, 1);
      }

      const { data } = await supabase
        .from("chats")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lt("created_at", endDate.toISOString())
        .order("created_at", { ascending: true });

      return data || [];
    },
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Jakarta'
  });

  // Fetch real-time stats
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return null;

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get today's chats
      const { count: todayCount } = await supabase
        .from("chats")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());

      // Get chats needing action
      const { count: needsActionCount } = await supabase
        .from("chats")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "needs_action");

      // Get payment alerts
      const { count: paymentCount } = await supabase
        .from("chats")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("payment_related", true)
        .eq("status", "needs_action");

      return {
        todayChats: todayCount || 0,
        needsActionChats: needsActionCount || 0,
        paymentAlerts: paymentCount || 0,
      };
    },
  });

  // Process real data into chart format
  const processChartData = () => {
    if (!chatData) return [];

    const aggregated: { [key: string]: number } = {};

    if (viewType === 'daily') {
      // Group by 4-hour intervals
      const intervals = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
      intervals.forEach(interval => aggregated[interval] = 0);

      chatData.forEach(chat => {
        const date = new Date(chat.created_at);
        const hour = date.getHours();
        const intervalKey = intervals[Math.floor(hour / 4)];
        aggregated[intervalKey]++;
      });

      return intervals.map(label => ({ label, count: aggregated[label] }));
    } else if (viewType === 'weekly') {
      // Group by day of week
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.forEach(day => aggregated[day] = 0);

      chatData.forEach(chat => {
        const date = new Date(chat.created_at);
        const dayName = days[date.getDay()];
        aggregated[dayName]++;
      });

      // Reorder to start from Monday
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(label => ({
        label,
        count: aggregated[label]
      }));
    } else {
      // Group by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(month => aggregated[month] = 0);

      chatData.forEach(chat => {
        const date = new Date(chat.created_at);
        const monthName = months[date.getMonth()];
        aggregated[monthName]++;
      });

      return months.map(label => ({ label, count: aggregated[label] }));
    }
  };

  const chartDataProcessed = processChartData();

  const kpiCards = [
    {
      title: "Today's Chats",
      value: stats?.todayChats || 0,
      icon: MessageSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      onClick: () => navigate('/chats')
    },
    {
      title: 'Needs Action',
      value: stats?.needsActionChats || 0,
      icon: AlertCircle,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      onClick: () => navigate('/chats?tab=needs-action')
    },
    {
      title: 'Payment Alerts',
      value: stats?.paymentAlerts || 0,
      icon: Receipt,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      onClick: () => navigate('/transactions')
    }
  ];

  // Fetch previous period data for comparison
  const { data: previousPeriodData } = useQuery({
    queryKey: ["analytics-previous", viewType, selectedPeriod],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];

      let startDate: Date;
      let endDate: Date;
      const now = new Date();

      if (viewType === 'daily') {
        const daysOffset = Math.abs(selectedPeriod) + 1;
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysOffset);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      } else if (viewType === 'weekly') {
        const weeksOffset = Math.abs(selectedPeriod) + 1;
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (weeksOffset * 7) - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (weeksOffset * 7) + 1);
        endDate.setHours(0, 0, 0, 0);
      } else {
        const yearsOffset = Math.abs(selectedPeriod) + 1;
        startDate = new Date(now.getFullYear() - yearsOffset, 0, 1);
        endDate = new Date(now.getFullYear() - yearsOffset + 1, 0, 1);
      }

      const { data } = await supabase
        .from("chats")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lt("created_at", endDate.toISOString());

      return data || [];
    },
  });

  const currentTotal = chartDataProcessed.reduce((sum, item) => sum + item.count, 0);
  const previousTotal = previousPeriodData?.length || 0;
  const percentageChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  
  const getPeriodLabel = (offset: number) => {
    if (viewType === 'daily') {
      if (offset === 0) return 'Today';
      if (offset === -1) return 'Yesterday';
      return `${Math.abs(offset)} Days Ago`;
    } else if (viewType === 'weekly') {
      if (offset === 0) return 'This Week';
      if (offset === -1) return 'Last Week';
      return `${Math.abs(offset)} Weeks Ago`;
    } else {
      if (offset === 0) return 'This Year';
      if (offset === -1) return 'Last Year';
      return `${Math.abs(offset)} Years Ago`;
    }
  };

  const getMaxOffset = () => {
    if (viewType === 'daily') return -7;
    if (viewType === 'weekly') return -4;
    return -3;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {profile?.business_name || 'User'}</h1>
        <p className="text-muted-foreground mt-1">{dateStr} (WIB)</p>
        <p className="text-sm text-muted-foreground mt-2">
          Monitor chats, human interventions, and payment flows powered by Vlowchat AI.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.title} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={card.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analytics Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Chats Analytics
                  </CardTitle>
                  <CardDescription>{getPeriodLabel(selectedPeriod)} - Conversation volume</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}
                >
                  {chartType === 'line' ? 'Bar' : 'Line'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <Tabs value={viewType} onValueChange={(v) => {
                  setViewType(v as ViewType);
                  setSelectedPeriod(0);
                }}>
                  <TabsList>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">vs previous:</span>
                  <Badge variant={percentageChange >= 0 ? "default" : "secondary"} className="gap-1">
                    {percentageChange >= 0 ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {Math.abs(percentageChange).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPeriod(selectedPeriod - 1)}
                disabled={selectedPeriod <= getMaxOffset()}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm font-medium">{getPeriodLabel(selectedPeriod)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPeriod(selectedPeriod + 1)}
                disabled={selectedPeriod >= 0}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              {chartType === 'line' ? (
                <LineChart data={chartDataProcessed}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="label" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Chats"
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartDataProcessed}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="label" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))"
                    name="Chats"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Issue & System Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Top Issue This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="secondary" className="text-sm">
                  Payment Confirmation
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Most common issue requiring attention this week
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Vlowchat AI</span>
                <Badge variant="default" className="bg-success text-success-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Webhook Events</span>
                <Badge variant="default" className="bg-success text-success-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">WhatsApp Channel</span>
                <Badge variant="default" className="bg-success text-success-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What's New</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>AI chatbot now supports Indonesian language detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Payment alert system with auto-detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Quick reply templates for faster responses</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Key Insights
          </CardTitle>
          <CardDescription>Performance metrics for {getPeriodLabel(selectedPeriod).toLowerCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Peak hours</p>
              <p className="text-2xl font-bold">2pm - 4pm</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg. response time</p>
              <p className="text-2xl font-bold">2.5 mins</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Resolution rate</p>
              <p className="text-2xl font-bold">94%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Customer satisfaction</p>
              <p className="text-2xl font-bold">4.8/5.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
