import InstagramIcon from '@/components/ui/InstagramIcon';
import { Calendar, Megaphone, Users } from 'lucide-react';

export default function Features() {
  return (
    <section id="learn-more" className="bg-muted/50 w-full py-12 md:py-24 lg:py-32">
      <div className="px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="bg-primary text-primary-foreground inline-block rounded-lg px-3 py-1 text-sm">
              How It Works
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Simplify Event Promotion
            </h2>
            <p className="text-muted-foreground max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              UofT EventNest helps university clubs reach more students by promoting events in the
              official UofT mobile app
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:gap-12">
          <div className="flex flex-col items-start space-y-4">
            <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-lg">
              <InstagramIcon className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Connect Instagram</h3>
              <p className="text-muted-foreground">
                Securely authorize access to your club&apos;s Instagram account with just a few
                clicks.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start space-y-4">
            <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-lg">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Event Discovery</h3>
              <p className="text-muted-foreground">
                We automatically detect and extract event details from your Instagram posts.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start space-y-4">
            <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-lg">
              <Megaphone className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Wider Reach</h3>
              <p className="text-muted-foreground">
                Your events get promoted on the official UofT mobile app.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start space-y-4">
            <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">No Extra Work</h3>
              <p className="text-muted-foreground">
                You give us permission to access your public Instagram posts and we handle the rest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
