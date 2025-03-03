'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function InstagramSuccessPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  // TODO add error handling if `error` is in returned search params

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function exchangeCode() {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/exchange-for-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          console.log('GOT HERE?');
          const errorResponse = await response.json();
          setError(errorResponse.error || 'Failed to exchange code for token');
          return;
        }

        const exchangeResponse = await response.json();
        if (!exchangeResponse.success) {
          setError('Failed to exchange code for token');
        }
        return exchangeResponse;
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      exchangeCode();
    }
  }, [code]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="rounded bg-white p-6 text-center shadow-md">
          <h2 className="mb-2 text-xl font-bold">Processing your request...</h2>
          <p className="text-gray-600">Gathering necessary permissions from Instagram...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="rounded bg-white p-6 text-center shadow-md">
          <h2 className="mb-2 text-xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600">There was an error processing your request: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="mx-auto max-w-md p-8 text-center shadow-lg">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">You&apos;re all set!</h1>

        <p className="mb-6 text-gray-600">
          We will regularly check your Instagram posts and promote any future events.
        </p>

        <p className="mb-8 text-sm text-gray-500">
          Your Instagram account has been successfully connected. You can now close this window or
          return to our home page.
        </p>

        <Button className="w-full">
          <Link href="/">Return to Home</Link>
        </Button>
      </Card>
    </div>
  );
}
