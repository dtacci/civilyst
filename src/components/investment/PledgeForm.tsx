'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '~/lib/trpc';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface PledgeFormProps {
  projectId: string;
  projectTitle: string;
  fundingGoal: number;
  currentFunding: number;
  onSuccess?: () => void;
}

export function PledgeForm({
  projectId,
  projectTitle,
  fundingGoal,
  currentFunding,
  onSuccess,
}: PledgeFormProps) {
  const { user, isLoaded } = useUser();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createPledge = api.pledges.create.useMutation();
  const initiateEscrow = api.escrow.initiate.useMutation();

  const maxAllowedPledge = fundingGoal - currentFunding;
  const suggestedAmounts = [100, 250, 500, 1000, 2500].filter(
    (amt) => amt <= maxAllowedPledge
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;

    const pledgeAmount = parseFloat(amount);
    if (isNaN(pledgeAmount) || pledgeAmount < 100 || pledgeAmount > 5000) {
      setError('Please enter a valid amount between $100 and $5,000');
      return;
    }

    if (pledgeAmount > maxAllowedPledge) {
      setError(
        `Maximum pledge amount for this project is $${maxAllowedPledge.toFixed(
          2
        )}`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create the pledge
      const pledge = await createPledge.mutateAsync({
        projectId,
        amount: pledgeAmount,
        paymentMethod: 'credit_card',
      });

      // Initiate escrow
      await initiateEscrow.mutateAsync({
        pledgeId: pledge.id,
      });

      setSuccess(true);
      setAmount('');
      onSuccess?.();

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pledge');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to make a pledge to this project.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make a Pledge</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Pledge Amount ($100 - $5,000)</Label>
            <div className="mt-2 space-y-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="100"
                max={Math.min(5000, maxAllowedPledge)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={isSubmitting}
                className="text-lg"
              />
              <div className="flex flex-wrap gap-2">
                {suggestedAmounts.map((suggestedAmount) => (
                  <Button
                    key={suggestedAmount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(suggestedAmount.toString())}
                    disabled={isSubmitting}
                  >
                    ${suggestedAmount}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Project: {projectTitle}</p>
            <p>Remaining to goal: ${maxAllowedPledge.toFixed(2)}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your pledge has been successfully created and funds are now in
                escrow!
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !amount}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Pledge...
              </>
            ) : (
              'Complete Pledge'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your funds will be held securely in escrow until project milestones
            are completed. You can request a refund at any time before funds are
            released.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
