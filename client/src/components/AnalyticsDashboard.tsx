import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MessageSquare, Phone, Activity } from 'lucide-react';

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
    loadAnalytics();
    loadDashboardStats();
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

  const calculateTotals = () => {
    return analyticsData.reduce(
      (acc, day) => ({
        messages: acc.messages + day.messagesSent + day.messagesReceived,
        calls: acc.calls + day.callsMade + day.callsReceived,
        activeMinutes: acc.activeMinutes + day.activeMinutes,
      }),
      { messages: 0, calls: 0, activeMinutes: 0 }
    );
  };

  const totals = calculateTotals();

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: number | string;
    subtitle?: string;
    color: string;
  }> = ({ icon, title, value, subtitle, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  if (loading && !analyticsData.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === days
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<Users className="w-6 h-6 text-white" />}
            title="Total Users"
            value={dashboardStats.totalUsers.toLocaleString()}
            color="bg-blue-500"
          />
          <StatCard
            icon={<Activity className="w-6 h-6 text-white" />}
            title="Active Users"
            value={dashboardStats.activeUsers.toLocaleString()}
            subtitle="Last 24 hours"
            color="bg-green-500"
          />
          <StatCard
            icon={<MessageSquare className="w-6 h-6 text-white" />}
            title="Messages Today"
            value={dashboardStats.todayMessages.toLocaleString()}
            color="bg-purple-500"
          />
          <StatCard
            icon={<Phone className="w-6 h-6 text-white" />}
            title="Calls Today"
            value={dashboardStats.todayCalls.toLocaleString()}
            color="bg-orange-500"
          />
          <StatCard
            icon={<BarChart3 className="w-6 h-6 text-white" />}
            title="Active Bots"
            value={dashboardStats.activeBots.toLocaleString()}
            color="bg-pink-500"
          />
        </div>
      )}

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<MessageSquare className="w-6 h-6 text-white" />}
          title="Total Messages"
          value={totals.messages.toLocaleString()}
          subtitle={`Last ${period} days`}
          color="bg-blue-500"
        />
        <StatCard
          icon={<Phone className="w-6 h-6 text-white" />}
          title="Total Calls"
          value={totals.calls.toLocaleString()}
          subtitle={`Last ${period} days`}
          color="bg-green-500"
        />
        <StatCard
          icon={<Activity className="w-6 h-6 text-white" />}
          title="Active Time"
          value={`${Math.round(totals.activeMinutes / 60)}h`}
          subtitle={`Last ${period} days`}
          color="bg-purple-500"
        />
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Activity Over Time</h2>
        <div className="space-y-4">
          {analyticsData.slice(-10).map((day, index) => {
            const maxMessages = Math.max(...analyticsData.map(d => d.messagesSent + d.messagesReceived));
            const totalMessages = day.messagesSent + day.messagesReceived;
            const percentage = (totalMessages / maxMessages) * 100;

            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {totalMessages} messages
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Detailed Statistics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Messages Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Messages Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calls</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Time</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {analyticsData.slice(-14).reverse().map((day, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{day.messagesSent}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{day.messagesReceived}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{day.callsMade + day.callsReceived}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{Math.round(day.activeMinutes)} min</td>
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
