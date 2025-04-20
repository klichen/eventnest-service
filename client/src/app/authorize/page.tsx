'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import 'dotenv/config';

export default function AuthorizationPage() {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const igError = searchParams.get('error');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unregistered, setUnregistered] = useState<boolean>(false);

  useEffect(() => {
    async function exchangeCode() {
      try {
        const apiUrl = `${API_BASE_URL}/api/auth/get-token`;
        console.log(apiUrl);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorResponse = await response.json();
          setError(errorResponse.error || 'Failed to exchange code for token');
          return;
        }

        const exchangeResponse = await response.json();
        if (!exchangeResponse.success && exchangeResponse.reason === 'notfound') {
          setUnregistered(true);
        }
        return exchangeResponse;
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (!code && !igError) {
      router.push('/');
    }

    if (code) {
      exchangeCode();
    }

    // error handling for cancelled IG auth
    if (igError) {
      setError('Instagram authorization cancelled');
    }
  }, [code, igError, API_BASE_URL, router]);

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

  if (unregistered) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="rounded bg-white p-6 text-center shadow-md">
          <h2 className="mb-2 text-xl font-bold text-red-600">Student Group Not Found</h2>
          <p className="text-gray-600">
            Your Instagram acount must be associated with a registered group under{' '}
            <a href="https://sop.utoronto.ca/groups/" target="_blank" className="text-blue-500">
              UofT SOP
            </a>
          </p>
          <Button asChild className="mt-3 w-full cursor-pointer">
            <Link href="/">Return to Main Screen</Link>
          </Button>
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
          <Link href="/">Return to Main Screen</Link>
        </Button>
      </Card>
    </div>
  );
}
