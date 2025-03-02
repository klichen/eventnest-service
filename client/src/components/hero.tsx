import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import InstagramIcon from '@/components/ui/InstagramIcon';

export default function Hero() {
  return (
    <section className="w-full py-12 md:py-24">
      <div className="px-4 md:px-6 lg:px-24">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Amplify Your Club Events
              </h1>
              <p className="text-muted-foreground max-w-[600px] md:text-xl">
                Connect your university club&apos;s Instagram account and let us help promote your
                events to a wider audience.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg" className="gap-1.5">
                <Link href="#join">
                  <InstagramIcon className="h-5 w-5" />
                  Connect with Instagram
                </Link>
              </Button>
            </div>
          </div>
          <Image
            alt="University students at an event"
            className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
            src="/images/uoft_clubs.jpeg"
            width={500}
            height={600}
          />
        </div>
      </div>
    </section>
  );
}
