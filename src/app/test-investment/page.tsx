'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '~/lib/trpc';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import Link from 'next/link';

export default function TestInvestmentPage() {
  const { user, isLoaded } = useUser();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Test mutations
  const createProject = api.projects.create.useMutation();
  const createPledge = api.pledges.create.useMutation();
  const initiateEscrow = api.escrow.initiate.useMutation();

  // Test queries
  const { data: featuredProjects } = api.projects.getFeatured.useQuery({
    limit: 3,
  });

  if (!isLoaded) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You need to be logged in to test the Investment Infrastructure.
            </p>
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toISOString()}: ${result}`,
    ]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // Test 1: Create a project
      addResult('Testing project creation...');
      const project = await createProject.mutateAsync({
        title: 'Test Community Garden Project',
        description:
          'A beautiful community garden to bring neighbors together and grow fresh vegetables.',
        fundingGoal: 10000,
        fundingDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        city: 'San Francisco',
        state: 'CA',
      });
      addResult(`✅ Project created: ${project.title} (ID: ${project.id})`);

      // Test 2: Create a pledge
      addResult('Testing pledge creation...');
      const pledge = await createPledge.mutateAsync({
        projectId: project.id,
        amount: 250,
        paymentMethod: 'credit_card',
      });
      addResult(`✅ Pledge created: $${pledge.amount} (ID: ${pledge.id})`);

      // Test 3: Initiate escrow
      addResult('Testing escrow initiation...');
      const escrow = await initiateEscrow.mutateAsync({
        pledgeId: pledge.id,
      });
      addResult(`✅ Escrow initiated: ${escrow.message}`);

      // Test 4: Check featured projects
      addResult('Testing featured projects query...');
      if (featuredProjects && featuredProjects.length > 0) {
        addResult(
          `✅ Featured projects loaded: ${featuredProjects.length} projects found`
        );
      } else {
        addResult('ℹ️ No featured projects found');
      }

      addResult('🎉 All tests completed successfully!');
    } catch (error) {
      addResult(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        Investment Infrastructure Test Page
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Endpoint Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={isLoading} className="mb-4">
            {isLoading ? 'Running Tests...' : 'Run Tests'}
          </Button>

          <div className="bg-gray-100 dark:bg-gray-800 rounded p-4">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            {testResults.length === 0 ? (
              <p className="text-gray-500">
                Click &quot;Run Tests&quot; to begin
              </p>
            ) : (
              <ul className="space-y-1">
                {testResults.map((result, index) => (
                  <li key={index} className="text-sm font-mono">
                    {result}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Featured Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {featuredProjects && featuredProjects.length > 0 ? (
            <div className="space-y-4">
              {featuredProjects.map((project) => (
                <div key={project.id} className="border rounded p-4">
                  <h4 className="font-semibold">{project.title}</h4>
                  <p className="text-sm text-gray-600">
                    Goal: ${project.fundingGoal} | Current: $
                    {project.currentFunding} (
                    {project.fundingPercentage.toFixed(1)}%)
                  </p>
                  <p className="text-sm text-gray-600">
                    Backers: {project.backerCount}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No featured projects yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
