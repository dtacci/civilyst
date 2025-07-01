'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '~/components/ui/button';

export function RefreshButton() {
  return (
    <Button onClick={() => window.location.reload()} className="w-full">
      <RefreshCw className="mr-2 h-4 w-4" />
      Try Again
    </Button>
  );
}
