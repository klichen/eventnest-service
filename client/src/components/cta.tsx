import Link from 'next/link';
import { Button } from '@/components/ui/button';
import InstagramIcon from '@/components/ui/InstagramIcon';

export default function CTA() {
  return (
    <section id="join" className="w-full py-12 md:py-24 lg:py-32">
      <div className="px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Ready to Boost Your Club&apos;s Visibility?
            </h2>
            <p className="text-muted-foreground max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join dozens of other UofT clubs already using EventNest to promote their events.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <Button asChild size="lg" className="w-full gap-1.5">
              <Link href="/auth/instagram">
                <InstagramIcon className="h-5 w-5" />
                Authorize with Instagram
              </Link>
            </Button>
            <p className="text-muted-foreground text-xs">
              We only request the minimum permissions needed to promote your events. Your account
              security is our priority.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
