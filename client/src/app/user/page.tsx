import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function InstagramSuccessPage() {
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
          Your Instagram account has been successfully connected. You can now return to the
          dashboard.
        </p>

        <Button className="w-full">
          <Link href="/">Return to Home</Link>
        </Button>
      </Card>
    </div>
  );
}
