'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '~/lib/trpc';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import {
  MapPin,
  User,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Megaphone,
  Users,
  Heart,
  TrendingUp,
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export function SmartOnboarding() {
  const { user } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    interests: [] as string[],
    location: null as {
      city: string;
      state: string;
      lat: number;
      lng: number;
    } | null,
    goals: [] as string[],
    profileType: null as 'citizen' | 'organizer' | 'official' | null,
  });

  // Check if user has completed onboarding
  const { data: profile } = api.users.getProfile.useQuery();
  const updateProfile = api.users.updateProfile.useMutation();
  const completeOnboarding = api.users.completeOnboarding.useMutation();

  useEffect(() => {
    if (profile?.hasCompletedOnboarding) {
      router.push('/dashboard');
    }
  }, [profile, router]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Civilyst!',
      description: "Let's personalize your civic engagement experience",
      icon: <Sparkles className="h-6 w-6" />,
      component: <WelcomeStep user={user} />,
    },
    {
      id: 'profile-type',
      title: 'How will you use Civilyst?',
      description: 'This helps us tailor your experience',
      icon: <User className="h-6 w-6" />,
      component: (
        <ProfileTypeStep
          value={onboardingData.profileType}
          onChange={(type) =>
            setOnboardingData({ ...onboardingData, profileType: type })
          }
        />
      ),
    },
    {
      id: 'location',
      title: 'Where are you making an impact?',
      description: 'Find campaigns and initiatives in your area',
      icon: <MapPin className="h-6 w-6" />,
      component: (
        <LocationStep
          value={onboardingData.location}
          onChange={(location) =>
            setOnboardingData({ ...onboardingData, location })
          }
        />
      ),
    },
    {
      id: 'interests',
      title: 'What matters to you?',
      description: "Select topics you're passionate about",
      icon: <Heart className="h-6 w-6" />,
      component: (
        <InterestsStep
          value={onboardingData.interests}
          onChange={(interests) =>
            setOnboardingData({ ...onboardingData, interests })
          }
        />
      ),
    },
    {
      id: 'goals',
      title: 'What do you want to achieve?',
      description: 'Set your civic engagement goals',
      icon: <Target className="h-6 w-6" />,
      component: (
        <GoalsStep
          value={onboardingData.goals}
          onChange={(goals) => setOnboardingData({ ...onboardingData, goals })}
          profileType={onboardingData.profileType}
        />
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Update user profile with onboarding data
      await updateProfile.mutateAsync({
        location: onboardingData.location
          ? `${onboardingData.location.city}, ${onboardingData.location.state}`
          : undefined,
        metadata: {
          interests: onboardingData.interests,
          goals: onboardingData.goals,
          profileType: onboardingData.profileType,
          onboardingVersion: '1.0',
        },
      });

      // Mark onboarding as complete
      await completeOnboarding.mutateAsync();

      // Redirect based on profile type
      switch (onboardingData.profileType) {
        case 'organizer':
          router.push('/campaigns/new');
          break;
        case 'official':
          router.push('/dashboard/analytics');
          break;
        default:
          router.push('/campaigns');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--color-primary]/5 to-[--color-secondary]/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index <= currentStep
                    ? 'text-[--color-primary]'
                    : 'text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      index === currentStep
                        ? 'border-[--color-primary] bg-[--color-primary]'
                        : 'border-current'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepData.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-[--color-border]">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[--color-primary]/10 flex items-center justify-center text-[--color-primary]">
                  {currentStepData.icon}
                </div>
                <CardTitle className="text-2xl">
                  {currentStepData.title}
                </CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {currentStepData.component}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            className="flex items-center gap-2"
            disabled={
              (currentStep === 1 && !onboardingData.profileType) ||
              (currentStep === 2 && !onboardingData.location) ||
              (currentStep === 3 && onboardingData.interests.length === 0) ||
              (currentStep === 4 && onboardingData.goals.length === 0)
            }
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Step Components
interface ClerkUser {
  firstName?: string | null;
}

function WelcomeStep({ user }: { user: ClerkUser | null | undefined }) {
  return (
    <div className="text-center space-y-6">
      <h3 className="text-xl font-semibold">
        Hi {user?.firstName || 'there'}, great to have you here! 👋
      </h3>
      <p className="text-[--color-text-secondary]">
        Civilyst is your platform for making real change in your community.
        Whether you want to:
      </p>
      <div className="grid gap-4 text-left max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <Megaphone className="h-5 w-5 text-[--color-primary] mt-1" />
          <div>
            <h4 className="font-medium">Start Campaigns</h4>
            <p className="text-sm text-[--color-text-secondary]">
              Create and lead initiatives that matter to your community
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-[--color-primary] mt-1" />
          <div>
            <h4 className="font-medium">Join Movements</h4>
            <p className="text-sm text-[--color-text-secondary]">
              Support campaigns and connect with like-minded citizens
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-[--color-primary] mt-1" />
          <div>
            <h4 className="font-medium">Track Impact</h4>
            <p className="text-sm text-[--color-text-secondary]">
              See real results from your civic engagement efforts
            </p>
          </div>
        </div>
      </div>
      <p className="text-sm text-[--color-text-secondary]">
        Let&apos;s get you set up in just a few steps!
      </p>
    </div>
  );
}

function ProfileTypeStep({
  value,
  onChange,
}: {
  value: 'citizen' | 'organizer' | 'official' | null;
  onChange: (type: 'citizen' | 'organizer' | 'official') => void;
}) {
  const types = [
    {
      id: 'citizen' as const,
      title: 'Engaged Citizen',
      description:
        'I want to support campaigns and stay informed about my community',
      icon: <Users className="h-8 w-8" />,
    },
    {
      id: 'organizer' as const,
      title: 'Campaign Organizer',
      description: 'I want to create campaigns and mobilize my community',
      icon: <Megaphone className="h-8 w-8" />,
    },
    {
      id: 'official' as const,
      title: 'City Official',
      description:
        'I represent a municipality and want to engage with citizens',
      icon: <Target className="h-8 w-8" />,
    },
  ];

  return (
    <div className="grid gap-4">
      {types.map((type) => (
        <button
          key={type.id}
          onClick={() => onChange(type.id)}
          className={`p-6 rounded-lg border-2 transition-all text-left ${
            value === type.id
              ? 'border-[--color-primary] bg-[--color-primary]/5'
              : 'border-[--color-border] hover:border-[--color-primary]/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="text-[--color-primary]">{type.icon}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-[--color-text-primary]">
                {type.title}
              </h4>
              <p className="text-sm text-[--color-text-secondary] mt-1">
                {type.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function LocationStep({
  value,
  onChange,
}: {
  value: { city: string; state: string; lat: number; lng: number } | null;
  onChange: (location: {
    city: string;
    state: string;
    lat: number;
    lng: number;
  }) => void;
}) {
  const [detecting, setDetecting] = useState(false);

  const detectLocation = async () => {
    setDetecting(true);
    try {
      // Get user's location
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      // Reverse geocode to get city/state
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
      );
      const data = await response.json();

      onChange({
        city:
          data.address.city ||
          data.address.town ||
          data.address.village ||
          'Unknown',
        state: data.address.state || 'Unknown',
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (error) {
      console.error('Error detecting location:', error);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        onClick={detectLocation}
        disabled={detecting}
        className="w-full"
        variant="outline"
      >
        <MapPin className="h-4 w-4 mr-2" />
        {detecting ? 'Detecting...' : 'Detect My Location'}
      </Button>

      {value && (
        <div className="p-4 rounded-lg bg-[--color-primary]/5 border border-[--color-primary]/20">
          <p className="text-sm text-[--color-text-secondary]">
            Your location:
          </p>
          <p className="font-semibold text-[--color-text-primary]">
            {value.city}, {value.state}
          </p>
        </div>
      )}

      <p className="text-center text-sm text-[--color-text-secondary]">
        Or manually enter your city in the next step
      </p>
    </div>
  );
}

function InterestsStep({
  value,
  onChange,
}: {
  value: string[];
  onChange: (interests: string[]) => void;
}) {
  const interests = [
    'Transportation',
    'Parks & Recreation',
    'Public Safety',
    'Education',
    'Housing',
    'Environment',
    'Local Business',
    'Arts & Culture',
    'Infrastructure',
    'Healthcare',
    'Social Services',
    'Technology',
  ];

  const toggleInterest = (interest: string) => {
    if (value.includes(interest)) {
      onChange(value.filter((i) => i !== interest));
    } else {
      onChange([...value, interest]);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[--color-text-secondary] text-center">
        Select at least 3 topics
      </p>
      <div className="grid grid-cols-2 gap-3">
        {interests.map((interest) => (
          <button
            key={interest}
            onClick={() => toggleInterest(interest)}
            className={`p-3 rounded-lg border transition-all text-sm font-medium ${
              value.includes(interest)
                ? 'border-[--color-primary] bg-[--color-primary] text-white'
                : 'border-[--color-border] hover:border-[--color-primary]/50'
            }`}
          >
            {interest}
          </button>
        ))}
      </div>
    </div>
  );
}

function GoalsStep({
  value,
  onChange,
  profileType,
}: {
  value: string[];
  onChange: (goals: string[]) => void;
  profileType: 'citizen' | 'organizer' | 'official' | null;
}) {
  const goalsByType = {
    citizen: [
      'Stay informed about local issues',
      'Support meaningful campaigns',
      'Connect with neighbors',
      'Make my voice heard',
      'Learn about civic processes',
    ],
    organizer: [
      'Launch successful campaigns',
      'Build community support',
      'Create lasting change',
      'Grow my network',
      'Track campaign impact',
    ],
    official: [
      'Understand citizen priorities',
      'Increase civic participation',
      'Communicate effectively',
      'Build trust with residents',
      'Make data-driven decisions',
    ],
  };

  const goals = profileType ? goalsByType[profileType] : goalsByType.citizen;

  const toggleGoal = (goal: string) => {
    if (value.includes(goal)) {
      onChange(value.filter((g) => g !== goal));
    } else {
      onChange([...value, goal]);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[--color-text-secondary] text-center">
        What would you like to achieve with Civilyst?
      </p>
      <div className="grid gap-3">
        {goals.map((goal) => (
          <button
            key={goal}
            onClick={() => toggleGoal(goal)}
            className={`p-4 rounded-lg border transition-all text-left ${
              value.includes(goal)
                ? 'border-[--color-primary] bg-[--color-primary]/5'
                : 'border-[--color-border] hover:border-[--color-primary]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  value.includes(goal)
                    ? 'border-[--color-primary] bg-[--color-primary]'
                    : 'border-gray-300'
                }`}
              >
                {value.includes(goal) && (
                  <CheckCircle2 className="h-3 w-3 text-white" />
                )}
              </div>
              <span className="text-sm font-medium">{goal}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
