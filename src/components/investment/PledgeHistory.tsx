'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  DollarSign,
  Calendar,
  MoreVertical,
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
// import type { PledgeStatus } from '@prisma/client';
type PledgeStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'RELEASED'
  | 'REFUNDED'
  | 'FAILED'
  | 'COMPLETED'
  | 'CANCELLED';

interface Pledge {
  id: string;
  amount: number;
  status: PledgeStatus;
  createdAt: Date;
  completedAt?: Date | null;
  refundedAt?: Date | null;
  project: {
    id: string;
    title: string;
    status: string;
    fundingGoal: number;
    fundingDeadline: Date;
    campaign?: {
      id: string;
      imageUrl?: string | null;
    } | null;
  };
}

interface PledgeHistoryProps {
  pledges: Pledge[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onRefundRequest?: (pledgeId: string) => void;
}

export function PledgeHistory({
  pledges,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  onRefundRequest,
}: PledgeHistoryProps) {
  const [selectedStatus, setSelectedStatus] = useState<PledgeStatus | 'ALL'>(
    'ALL'
  );

  const filteredPledges =
    selectedStatus === 'ALL'
      ? pledges
      : pledges.filter((p) => p.status === selectedStatus);

  const getStatusIcon = (status: PledgeStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'REFUNDED':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: PledgeStatus) => {
    const variants: Record<
      PledgeStatus,
      'default' | 'secondary' | 'destructive'
    > = {
      PENDING: 'secondary',
      PROCESSING: 'default',
      CONFIRMED: 'default',
      RELEASED: 'default',
      COMPLETED: 'default',
      FAILED: 'destructive',
      REFUNDED: 'secondary',
      CANCELLED: 'secondary',
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        <span className="capitalize">{status.toLowerCase()}</span>
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getTotalByStatus = () => {
    const totals = pledges.reduce(
      (acc, pledge) => {
        acc[pledge.status] = (acc[pledge.status] || 0) + pledge.amount;
        acc.total += pledge.amount;
        return acc;
      },
      { total: 0 } as Record<string, number>
    );
    return totals;
  };

  const totals = getTotalByStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pledge History</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as PledgeStatus | 'ALL')
              }
              className="text-sm border rounded-md px-3 py-1"
            >
              <option value="ALL">All Pledges</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Pledged</p>
            <p className="text-xl font-semibold">
              {formatCurrency(totals.total)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-xl font-semibold text-green-600">
              {formatCurrency(totals.COMPLETED || 0)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-xl font-semibold text-yellow-600">
              {formatCurrency(totals.PENDING || 0)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Refunded</p>
            <p className="text-xl font-semibold text-blue-600">
              {formatCurrency(totals.REFUNDED || 0)}
            </p>
          </div>
        </div>

        {/* Pledge List */}
        <div className="space-y-3">
          {filteredPledges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedStatus === 'ALL'
                ? 'No pledges yet. Start supporting projects to see your pledge history.'
                : `No ${selectedStatus.toLowerCase()} pledges found.`}
            </div>
          ) : (
            filteredPledges.map((pledge) => (
              <div
                key={pledge.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Project Image */}
                  {pledge.project.campaign?.imageUrl && (
                    <img
                      src={pledge.project.campaign.imageUrl}
                      alt={pledge.project.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}

                  {/* Pledge Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(pledge.status)}
                      <Link
                        href={`/projects/${pledge.project.id}`}
                        className="font-medium hover:underline"
                      >
                        {pledge.project.title}
                      </Link>
                      {getStatusBadge(pledge.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{formatCurrency(pledge.amount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {pledge.status === 'COMPLETED' && pledge.completedAt
                            ? `Completed ${formatDate(pledge.completedAt)}`
                            : pledge.status === 'REFUNDED' && pledge.refundedAt
                              ? `Refunded ${formatDate(pledge.refundedAt)}`
                              : `Pledged ${formatDate(pledge.createdAt)}`}
                        </span>
                      </div>
                    </div>
                    {pledge.project.status === 'ACTIVE' && (
                      <p className="text-xs text-muted-foreground">
                        Project deadline:{' '}
                        {formatDate(pledge.project.fundingDeadline)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${pledge.project.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Project
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download Receipt
                    </DropdownMenuItem>
                    {pledge.status === 'COMPLETED' &&
                      pledge.project.status !== 'COMPLETED' &&
                      onRefundRequest && (
                        <DropdownMenuItem
                          onClick={() => onRefundRequest(pledge.id)}
                          className="text-red-600"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Request Refund
                        </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center pt-4">
            <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
