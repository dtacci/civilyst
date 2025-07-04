'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Alert, AlertDescription } from '~/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Shield,
  Languages,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface AIAdminDashboardProps {
  className?: string;
}

// Mock data for demonstration
const usageData = [
  { time: '00:00', requests: 45, costs: 0.12, latency: 180 },
  { time: '04:00', requests: 23, costs: 0.06, latency: 165 },
  { time: '08:00', requests: 89, costs: 0.24, latency: 190 },
  { time: '12:00', requests: 156, costs: 0.42, latency: 210 },
  { time: '16:00', requests: 134, costs: 0.36, latency: 195 },
  { time: '20:00', requests: 98, costs: 0.26, latency: 175 },
];

const serviceData = [
  { name: 'Content Suggestions', requests: 450, success: 98.2, avgCost: 0.003 },
  { name: 'Content Moderation', requests: 890, success: 99.1, avgCost: 0.002 },
  { name: 'Sentiment Analysis', requests: 234, success: 97.8, avgCost: 0.004 },
  { name: 'Translation', requests: 156, success: 96.5, avgCost: 0.008 },
  { name: 'Accessibility', requests: 67, success: 95.2, avgCost: 0.006 },
];

const errorData = [
  { service: 'OpenAI', count: 12, type: 'Rate Limit' },
  { service: 'Google Cloud', count: 5, type: 'Network Error' },
  { service: 'Azure', count: 3, type: 'Authentication' },
  { service: 'Perplexity', count: 8, type: 'Timeout' },
];

const costBreakdown = [
  { name: 'OpenAI', value: 45.2, color: '#8884d8' },
  { name: 'Google Cloud', value: 23.8, color: '#82ca9d' },
  { name: 'Azure', value: 18.4, color: '#ffc658' },
  { name: 'Perplexity', value: 12.6, color: '#ff7300' },
];

export function AIAdminDashboard({ className }: AIAdminDashboardProps) {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (success: number) => {
    if (success >= 98) return 'text-green-600';
    if (success >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (success: number) => {
    if (success >= 98)
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (success >= 95)
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const totalRequests = serviceData.reduce(
    (sum, service) => sum + service.requests,
    0
  );
  const totalCosts = costBreakdown.reduce((sum, item) => sum + item.value, 0);
  const avgLatency =
    usageData.reduce((sum, data) => sum + data.latency, 0) / usageData.length;
  const totalErrors = errorData.reduce((sum, error) => sum + error.count, 0);

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  AI Services Dashboard
                </CardTitle>
                <CardDescription>
                  Monitor AI service performance, costs, and usage metrics
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Requests</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">
                  {totalRequests.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  +12% from last hour
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Total Costs</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">
                  ${totalCosts.toFixed(2)}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  +8% from yesterday
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Avg Latency</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">
                  {Math.round(avgLatency)}ms
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3" />
                  -5% from last hour
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Errors (24h)</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{totalErrors}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3" />
                  -15% from yesterday
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Volume (Last 24h)</CardTitle>
              <CardDescription>AI service requests over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Distribution</CardTitle>
              <CardDescription>Costs by AI service provider</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${value}`}
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Service Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Service Performance</CardTitle>
            <CardDescription>
              Success rates and performance metrics by AI feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceData.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1">
                    {service.name === 'Content Suggestions' && (
                      <Zap className="h-4 w-4" />
                    )}
                    {service.name === 'Content Moderation' && (
                      <Shield className="h-4 w-4" />
                    )}
                    {service.name === 'Sentiment Analysis' && (
                      <Activity className="h-4 w-4" />
                    )}
                    {service.name === 'Translation' && (
                      <Languages className="h-4 w-4" />
                    )}
                    {service.name === 'Accessibility' && (
                      <Eye className="h-4 w-4" />
                    )}
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {service.requests} requests
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">Success Rate</div>
                      <div
                        className={`flex items-center gap-1 ${getStatusColor(service.success)}`}
                      >
                        {getStatusIcon(service.success)}
                        {service.success}%
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="font-medium">Avg Cost</div>
                      <div className="text-muted-foreground">
                        ${service.avgCost.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
            <CardDescription>
              AI service errors and issues (Last 24h)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorData.length > 0 ? (
              <div className="space-y-3">
                {errorData.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>
                          <strong>{error.service}</strong>: {error.type} error (
                          {error.count} occurrences)
                        </span>
                        <Badge variant="outline">{error.count}</Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p>No errors in the last 24 hours</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limit Status</CardTitle>
              <CardDescription>
                Current usage against rate limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>OpenAI GPT-3.5</span>
                  <span>750/1000 RPM</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Google Cloud Vision</span>
                  <span>450/600 RPM</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Azure Text Analytics</span>
                  <span>120/200 RPM</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Google Translate</span>
                  <span>89/100 RPM</span>
                </div>
                <Progress value={89} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>
                Users currently using AI features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">24</div>
                    <div className="text-sm text-muted-foreground">
                      Active users
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Creating content suggestions</span>
                    <span>8 users</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Using moderation tools</span>
                    <span>6 users</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Translating content</span>
                    <span>4 users</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Analyzing sentiment</span>
                    <span>3 users</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Accessibility tools</span>
                    <span>3 users</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
