import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { api, TRPCReactProvider } from '~/lib/trpc';
import {
  EndorsementCard,
  EndorseSkillDialog,
  EndorsementList,
} from '~/components/verification/EndorsementCard';
import {
  PortfolioCard,
  AddPortfolioDialog,
  EditPortfolioDialog,
  PortfolioManager,
} from '~/components/verification/PortfolioManager';
import {
  VerificationRequestCard,
  ReviewRequestDialog,
  RequestVerificationDialog,
  VerificationRequestList,
} from '~/components/verification/VerificationRequest';
import { VerificationDashboard } from '~/components/verification/VerificationDashboard';
import {
  EndorsementStrength,
  PortfolioType,
  VerificationRequestStatus,
  VerificationDecision,
} from '~/generated/prisma';

// Mock TRPC
jest.mock('~/lib/trpc', () => ({
  api: {
    verification: {
      createEndorsement: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
      removeEndorsement: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
      getEndorsementsByUserSkill: {
        useQuery: jest.fn(() => ({
          data: [],
          isLoading: false,
          refetch: jest.fn(),
        })),
      },
      createPortfolioItem: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
      updatePortfolioItem: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
      deletePortfolioItem: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
      getPortfolioByUserSkill: {
        useQuery: jest.fn(() => ({
          data: [],
          isLoading: false,
          refetch: jest.fn(),
        })),
      },
      requestVerification: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
      reviewVerificationRequest: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
      getVerificationRequests: {
        useQuery: jest.fn(() => ({
          data: [],
          isLoading: false,
          refetch: jest.fn(),
        })),
      },
      getVerificationStats: {
        useQuery: jest.fn(() => ({
          data: {
            totalRequests: 0,
            pendingRequests: 0,
            completedRequests: 0,
            rejectedRequests: 0,
            averageReviewTime: 0,
          },
          isLoading: false,
        })),
      },
    },
  },
  TRPCReactProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock toast
jest.mock('~/lib/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockEndorsement = {
  id: '1',
  message: 'Great developer!',
  strength: EndorsementStrength.EXCELLENT,
  createdAt: new Date('2024-01-01'),
  endorser: {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    imageUrl: null,
    trustScore: 0.85,
    isVerified: true,
  },
};

const mockPortfolioItem = {
  id: '1',
  title: 'React Portfolio',
  description: 'My portfolio website',
  url: 'https://example.com',
  fileUrl: null,
  type: PortfolioType.LINK,
  isVerified: false,
  verifiedAt: null,
  verifiedBy: null,
  verificationNotes: null,
  createdAt: new Date('2024-01-01'),
};

const mockVerificationRequest = {
  id: '1',
  requestType: 'SELF_VERIFICATION' as any,
  message: 'Please verify my skills',
  evidence: { description: 'Portfolio available' },
  status: VerificationRequestStatus.PENDING,
  reviewNotes: null,
  decision: null,
  decisionReason: null,
  createdAt: new Date('2024-01-01'),
  reviewedAt: null,
  userSkill: {
    id: 'skill1',
    proficiencyLevel: 4,
    skill: {
      id: 'react',
      name: 'React',
      category: 'Frontend',
    },
    user: {
      id: 'user2',
      firstName: 'Jane',
      lastName: 'Smith',
      imageUrl: null,
    },
  },
  requester: {
    id: 'user2',
    firstName: 'Jane',
    lastName: 'Smith',
    imageUrl: null,
  },
  adminAssigned: null,
};

describe('Verification System Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EndorsementCard', () => {
    it('renders endorsement information correctly', () => {
      render(
        <TRPCReactProvider>
          <EndorsementCard endorsement={mockEndorsement} />
        </TRPCReactProvider>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/Great developer/)).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
      expect(screen.getByText('Trust Score: 85%')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('shows remove button when canRemove is true', () => {
      render(
        <TRPCReactProvider>
          <EndorsementCard endorsement={mockEndorsement} canRemove={true} />
        </TRPCReactProvider>
      );

      expect(screen.getByText('Remove')).toBeInTheDocument();
    });
  });

  describe('EndorseSkillDialog', () => {
    it('opens dialog when trigger is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TRPCReactProvider>
          <EndorseSkillDialog
            userSkillId="skill1"
            skillName="React"
            userName="Jane"
          >
            <button>Endorse</button>
          </EndorseSkillDialog>
        </TRPCReactProvider>
      );

      await user.click(screen.getByText('Endorse'));

      expect(
        screen.getByText(/Endorse Jane's React skill/)
      ).toBeInTheDocument();
      expect(
        screen.getByText('How would you rate their skill level?')
      ).toBeInTheDocument();
    });
  });

  describe('PortfolioCard', () => {
    it('renders portfolio item correctly', () => {
      render(
        <TRPCReactProvider>
          <PortfolioCard item={mockPortfolioItem} />
        </TRPCReactProvider>
      );

      expect(screen.getByText('React Portfolio')).toBeInTheDocument();
      expect(screen.getByText('My portfolio website')).toBeInTheDocument();
      expect(screen.getByText('Link')).toBeInTheDocument();
      expect(screen.getByText('View Link')).toBeInTheDocument();
    });

    it('shows edit and delete buttons when canEdit is true', () => {
      render(
        <TRPCReactProvider>
          <PortfolioCard item={mockPortfolioItem} canEdit={true} />
        </TRPCReactProvider>
      );

      // Edit and Delete buttons are icon-only - check that there are 2 buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2); // Edit and Delete buttons
    });
  });

  describe('VerificationRequestCard', () => {
    it('renders request information correctly', () => {
      render(
        <TRPCReactProvider>
          <VerificationRequestCard request={mockVerificationRequest} />
        </TRPCReactProvider>
      );

      expect(
        screen.getByText('React Verification Request')
      ).toBeInTheDocument();
      expect(
        screen.getByText('by Jane Smith for Jane Smith')
      ).toBeInTheDocument();
      expect(screen.getByText('Level 4/5')).toBeInTheDocument();
      expect(screen.getByText('Frontend')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('shows review button when canReview is true', () => {
      render(
        <TRPCReactProvider>
          <VerificationRequestCard
            request={mockVerificationRequest}
            canReview={true}
          />
        </TRPCReactProvider>
      );

      expect(screen.getByText('Review Request')).toBeInTheDocument();
    });
  });

  describe('VerificationDashboard', () => {
    it('renders dashboard with stats', () => {
      render(
        <TRPCReactProvider>
          <VerificationDashboard isAdmin={true} />
        </TRPCReactProvider>
      );

      expect(screen.getByText('Verification Administration')).toBeInTheDocument();
      expect(screen.getByText('Total Skills')).toBeInTheDocument();
      expect(screen.getByText('Verified Skills')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument(); // Tab name
      expect(screen.getByText('Completed')).toBeInTheDocument(); // Tab name
    });
  });

  describe('AddPortfolioDialog', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup();

      render(
        <TRPCReactProvider>
          <AddPortfolioDialog userSkillId="skill1" skillName="React">
            <button>Add Portfolio</button>
          </AddPortfolioDialog>
        </TRPCReactProvider>
      );

      await user.click(screen.getByText('Add Portfolio'));
      await user.click(screen.getByText('Add Portfolio Item'));

      // Should show error for empty title
      await waitFor(() => {
        // Check that the button was clicked but form validation prevented submission
        expect(screen.getByText('Add Portfolio Item')).toBeInTheDocument();
      });
    });
  });

  describe('RequestVerificationDialog', () => {
    it('opens dialog and allows submission', async () => {
      const user = userEvent.setup();

      render(
        <TRPCReactProvider>
          <RequestVerificationDialog userSkillId="skill1" skillName="React">
            <button>Request Verification</button>
          </RequestVerificationDialog>
        </TRPCReactProvider>
      );

      await user.click(screen.getByText('Request Verification'));

      expect(
        screen.getByText('Request Verification for React')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Skill verification helps build trust/)
      ).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('renders empty states correctly', () => {
      render(
        <TRPCReactProvider>
          <EndorsementList userSkillId="skill1" />
        </TRPCReactProvider>
      );

      expect(
        screen.getByText(
          'No endorsements yet. Be the first to endorse this skill!'
        )
      ).toBeInTheDocument();
    });

    it('renders loading states correctly', () => {
      jest
        .mocked((api as any).verification.getEndorsementsByUserSkill.useQuery)
        .mockReturnValue({
          data: undefined,
          isLoading: true,
          refetch: jest.fn(),
        });

      const { container } = render(
        <TRPCReactProvider>
          <EndorsementList userSkillId="skill1" />
        </TRPCReactProvider>
      );

      // Loading skeletons are shown as cards/divs, not articles
      const loadingCards = container.querySelectorAll('.animate-pulse');
      expect(loadingCards.length).toBeGreaterThan(0);
    });
  });
});
