import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, AlertCircle, Receipt, TrendingUp, Activity, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockDashboardStats } from '@/lib/mockData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Home() {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, -1 = last week, etc.

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

  const stats = mockDashboardStats;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Jakarta'
  });

  // Generate weekly data based on selected week
  const getWeekData = (weekOffset: number) => {
    const baseData = [
      { day: 'Mon', date: '18/11', count: 45 },
      { day: 'Tue', date: '19/11', count: 52 },
      { day: 'Wed', date: '20/11', count: 38 },
      { day: 'Thu', date: '21/11', count: 65 },
      { day: 'Fri', date: '22/11', count: 48 },
      { day: 'Sat', date: '23/11', count: 34 },
      { day: 'Sun', date: '24/11', count: 28 },
    ];
    
    // Adjust data based on week offset
    const multiplier = 1 + (weekOffset * 0.15);
    return baseData.map(item => ({
      ...item,
      count: Math.max(10, Math.floor(item.count * multiplier))
    }));
  };

  const weekData = getWeekData(selectedWeek);
  
  const getWeekLabel = (offset: number) => {
    if (offset === 0) return 'This Week';
    if (offset === -1) return 'Last Week';
    return `${Math.abs(offset)} Weeks Ago`;
  };

  const kpiCards = [
    {
      title: "Today's Chats",
      value: stats.todayChats,
      icon: MessageSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      onClick: () => navigate('/chats')
    },
    {
      title: 'Needs Action',
      value: stats.needsActionChats,
      icon: AlertCircle,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      onClick: () => navigate('/chats?tab=needs-action')
    },
    {
      title: 'Payment Alerts',
      value: stats.paymentAlerts,
      icon: Receipt,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      onClick: () => navigate('/transactions')
    }
  ];

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Chats Analytics
                </CardTitle>
                <CardDescription>{getWeekLabel(selectedWeek)} - Daily conversation volume</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}
                >
                  {chartType === 'line' ? 'Bar' : 'Line'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedWeek(selectedWeek - 1)}
                disabled={selectedWeek <= -4}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm font-medium">{getWeekLabel(selectedWeek)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedWeek(selectedWeek + 1)}
                disabled={selectedWeek >= 0}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              {chartType === 'line' ? (
                <LineChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
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
                <BarChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
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
                  {stats.topIssue.label}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {stats.topIssue.description}
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
          <CardDescription>Performance metrics for {getWeekLabel(selectedWeek).toLowerCase()}</CardDescription>
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
