'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  return (
    <header className="bg-background/95 sticky z-50 w-full border-b backdrop-blur">
      <div className="flex h-16 items-center justify-between px-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span>UofT EventNest</span>
        </Link>
        <Button>
          <Link href="#join">Join us</Link>
        </Button>
      </div>
    </header>
  );
}
