'use client';

import { useState } from 'react';
import {
  PledgeForm,
  FundingProgress,
  MilestoneTracker,
  PledgeHistory,
} from '~/components/investment';
import type { PledgeStatus, MilestoneStatus } from '@prisma/client';

// Mock data for demonstration
const mockProject = {
  id: 'demo-project-1',
  title: 'Community Garden Revitalization',
  fundingGoal: 50000,
  currentFunding: 32500,
  backerCount: 47,
  deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
};

const mockMilestones = [
  {
    id: '1',
    title: 'Site Preparation & Cleanup',
    description: 'Clear the area, remove debris, and prepare soil for planting',
    fundingAmount: 10000,
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'COMPLETED' as MilestoneStatus,
    orderIndex: 0,
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    releasedAmount: 10000,
  },
  {
    id: '2',
    title: 'Install Irrigation System',
    description: 'Set up water infrastructure and automated irrigation',
    fundingAmount: 15000,
    targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    status: 'VERIFIED' as MilestoneStatus,
    orderIndex: 1,
    releasedAmount: 0,
  },
  {
    id: '3',
    title: 'Build Garden Beds & Pathways',
    description:
      'Construct raised beds and accessible pathways throughout the garden',
    fundingAmount: 20000,
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    status: 'PENDING' as MilestoneStatus,
    orderIndex: 2,
    releasedAmount: 0,
  },
  {
    id: '4',
    title: 'Plant & Launch Community Programs',
    description: 'Initial planting and start educational workshops',
    fundingAmount: 5000,
    targetDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    status: 'PENDING' as MilestoneStatus,
    orderIndex: 3,
    releasedAmount: 0,
  },
];

const mockPledges = [
  {
    id: '1',
    amount: 500,
    status: 'COMPLETED' as PledgeStatus,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    project: {
      id: '1',
      title: 'Community Garden Revitalization',
      status: 'ACTIVE',
      fundingGoal: 50000,
      fundingDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      campaign: {
        id: '1',
        imageUrl:
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop',
      },
    },
  },
  {
    id: '2',
    amount: 250,
    status: 'COMPLETED' as PledgeStatus,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    project: {
      id: '2',
      title: 'Downtown Mural Project',
      status: 'FUNDED',
      fundingGoal: 25000,
      fundingDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      campaign: {
        id: '2',
        imageUrl:
          'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=200&h=200&fit=crop',
      },
    },
  },
  {
    id: '3',
    amount: 1000,
    status: 'PENDING' as PledgeStatus,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    project: {
      id: '3',
      title: 'Youth Sports Equipment Fund',
      status: 'ACTIVE',
      fundingGoal: 15000,
      fundingDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
  },
  {
    id: '4',
    amount: 100,
    status: 'REFUNDED' as PledgeStatus,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    refundedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    project: {
      id: '4',
      title: 'Mobile Library Initiative',
      status: 'CANCELLED',
      fundingGoal: 40000,
      fundingDeadline: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  },
];

export default function InvestmentDemoPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePledgeSuccess = () => {
    // In a real app, this would refresh the funding data
    setRefreshKey((prev) => prev + 1);
  };

  const handleMilestoneClick = (milestone: any) => {
    console.log('Milestone clicked:', milestone);
  };

  const handleRefundRequest = (pledgeId: string) => {
    console.log('Refund requested for pledge:', pledgeId);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">
        Investment Infrastructure Demo
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Project Info & Pledge Form */}
        <div className="space-y-6">
          <div className="bg-gray-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">{mockProject.title}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Help transform an abandoned lot into a thriving community garden
              that will provide fresh produce and educational opportunities for
              local residents.
            </p>
          </div>

          <FundingProgress
            key={refreshKey}
            fundingGoal={mockProject.fundingGoal}
            currentFunding={mockProject.currentFunding}
            backerCount={mockProject.backerCount}
            deadline={mockProject.deadline}
          />

          <PledgeForm
            projectId={mockProject.id}
            projectTitle={mockProject.title}
            fundingGoal={mockProject.fundingGoal}
            currentFunding={mockProject.currentFunding}
            onSuccess={handlePledgeSuccess}
          />
        </div>

        {/* Middle Column - Milestones */}
        <div className="lg:col-span-1">
          <MilestoneTracker
            milestones={mockMilestones}
            totalFunding={mockProject.fundingGoal}
            isProjectCreator={false}
            onMilestoneClick={handleMilestoneClick}
          />
        </div>

        {/* Right Column - Pledge History */}
        <div className="lg:col-span-1">
          <PledgeHistory
            pledges={mockPledges}
            hasMore={false}
            onRefundRequest={handleRefundRequest}
          />
        </div>
      </div>

      {/* Full Width Section - Additional Examples */}
      <div className="mt-12 space-y-8">
        <h2 className="text-2xl font-semibold">Component Variations</h2>

        {/* Fully Funded Project */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Fully Funded Project</h3>
          <FundingProgress
            fundingGoal={25000}
            currentFunding={25000}
            backerCount={125}
            deadline={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)}
          />
        </div>

        {/* Project Creator View */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">
            Milestone Tracker - Project Creator View
          </h3>
          <MilestoneTracker
            milestones={mockMilestones}
            totalFunding={mockProject.fundingGoal}
            isProjectCreator={true}
            onMilestoneClick={handleMilestoneClick}
          />
        </div>
      </div>
    </div>
  );
}
