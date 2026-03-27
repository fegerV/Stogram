import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, MessageSquare, Phone, TrendingUp, Users } from 'lucide-react';

interface AnalyticsData {
  date: string;
  messagesSent: number;
  messagesReceived: number;
  callsMade: number;
  callsReceived: number;
  activeMinutes: number;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  todayMessages: number;
  todayCalls: number;
  activeBots: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadAnalytics();
    void loadDashboardStats();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/user?days=${period}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const totals = analyticsData.reduce(
    (acc, day) => ({
      messages: acc.messages + day.messagesSent + day.messagesReceived,
      calls: acc.calls + day.callsMade + day.callsReceived,
      activeMinutes: acc.activeMinutes + day.activeMinutes,
    }),
    { messages: 0, calls: 0, activeMinutes: 0 },
  );

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: number | string;
    subtitle?: string;
    color: string;
  }> = ({ icon, title, value, subtitle, color }) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#24323d] dark:bg-[#17212b]">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-2xl p-3 ${color}`}>{icon}</div>
        <TrendingUp className="h-5 w-5 text-emerald-500" />
      </div>
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );

  if (loading && !analyticsData.length) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#3390ec]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-[#3390ec]" />
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`rounded-xl px-4 py-2 font-medium transition-colors ${
                period === days
                  ? 'bg-[#3390ec] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#202b36] dark:text-slate-300 dark:hover:bg-[#2a3947]'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {dashboardStats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard
            icon={<Users className="h-6 w-6 text-white" />}
            title="Total Users"
            value={dashboardStats.totalUsers.toLocaleString()}
            color="bg-[#3390ec]"
          />
          <StatCard
            icon={<Activity className="h-6 w-6 text-white" />}
            title="Active Users"
            value={dashboardStats.activeUsers.toLocaleString()}
            subtitle="Last 24 hours"
            color="bg-emerald-500"
          />
          <StatCard
            icon={<MessageSquare className="h-6 w-6 text-white" />}
            title="Messages Today"
            value={dashboardStats.todayMessages.toLocaleString()}
            color="bg-violet-500"
          />
          <StatCard
            icon={<Phone className="h-6 w-6 text-white" />}
            title="Calls Today"
            value={dashboardStats.todayCalls.toLocaleString()}
            color="bg-orange-500"
          />
          <StatCard
            icon={<BarChart3 className="h-6 w-6 text-white" />}
            title="Active Bots"
            value={dashboardStats.activeBots.toLocaleString()}
            color="bg-pink-500"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          icon={<MessageSquare className="h-6 w-6 text-white" />}
          title="Total Messages"
          value={totals.messages.toLocaleString()}
          subtitle={`Last ${period} days`}
          color="bg-[#3390ec]"
        />
        <StatCard
          icon={<Phone className="h-6 w-6 text-white" />}
          title="Total Calls"
          value={totals.calls.toLocaleString()}
          subtitle={`Last ${period} days`}
          color="bg-emerald-500"
        />
        <StatCard
          icon={<Activity className="h-6 w-6 text-white" />}
          title="Active Time"
          value={`${Math.round(totals.activeMinutes / 60)}h`}
          subtitle={`Last ${period} days`}
          color="bg-violet-500"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#24323d] dark:bg-[#17212b]">
        <h2 className="mb-6 text-xl font-bold">Activity Over Time</h2>
        <div className="space-y-4">
          {analyticsData.slice(-10).map((day, index) => {
            const maxMessages = Math.max(...analyticsData.map((item) => item.messagesSent + item.messagesReceived));
            const totalMessages = day.messagesSent + day.messagesReceived;
            const percentage = maxMessages > 0 ? (totalMessages / maxMessages) * 100 : 0;

            return (
              <div key={index}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{totalMessages} messages</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-[#24323d]">
                  <div className="h-2 rounded-full bg-[#3390ec] transition-all" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-[#24323d] dark:bg-[#17212b]">
        <div className="border-b border-slate-200 p-6 dark:border-[#24323d]">
          <h2 className="text-xl font-bold">Detailed Statistics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-[#202b36]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Messages Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Messages Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Calls</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Active Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#24323d]">
              {analyticsData.slice(-14).reverse().map((day, index) => (
                <tr key={index} className="transition hover:bg-slate-50 dark:hover:bg-[#202b36]">
                  <td className="whitespace-nowrap px-6 py-4">{new Date(day.date).toLocaleDateString()}</td>
                  <td className="whitespace-nowrap px-6 py-4">{day.messagesSent}</td>
                  <td className="whitespace-nowrap px-6 py-4">{day.messagesReceived}</td>
                  <td className="whitespace-nowrap px-6 py-4">{day.callsMade + day.callsReceived}</td>
                  <td className="whitespace-nowrap px-6 py-4">{Math.round(day.activeMinutes)} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
