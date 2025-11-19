import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, AlertCircle, Receipt, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';
import { mockDashboardStats, mockBusiness } from '@/lib/mockData';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const stats = mockDashboardStats;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Jakarta'
  });

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
        <h1 className="text-3xl font-bold">Welcome, {mockBusiness.name}</h1>
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
        {/* Chats This Week Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Chats This Week
            </CardTitle>
            <CardDescription>Daily conversation volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.chatsThisWeek.map((day, index) => {
                const maxCount = Math.max(...stats.chatsThisWeek.map(d => d.count));
                const width = (day.count / maxCount) * 100;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground w-12">{day.date}</span>
                      <span className="font-medium">{day.count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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
    </div>
  );
}
