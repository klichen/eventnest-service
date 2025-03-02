export default function Footer() {
  return (
    <footer className="w-full border-t px-2 py-6">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-sm">
            © 2025 UofT EventNest. All rights reserved.
          </p>
        </div>
        {/* ADD Links if needed */}
        {/* <nav className="text-muted-foreground flex gap-4 text-sm">
          <Link href="#" className="hover:underline">
            Terms
          </Link>
          <Link href="#" className="hover:underline">
            Privacy
          </Link>
          <Link href="#" className="hover:underline">
            Contact
          </Link>
        </nav> */}
      </div>
    </footer>
  );
}
