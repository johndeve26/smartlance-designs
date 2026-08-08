import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Page not found</h1>
      <p className="mt-4 max-w-md text-muted">
        The page you are looking for does not exist or may have moved. Try one
        of these helpful links instead.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Tell Us About Your Project</Link>
        </Button>
      </div>
      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[0.9375rem] text-muted">
        <Link href="/services" className="font-semibold text-accent-text hover:underline">
          Explore Services
        </Link>
        <Link href="/solutions" className="font-semibold text-accent-text hover:underline">
          Explore Solutions
        </Link>
        <Link href="/resources" className="font-semibold text-accent-text hover:underline">
          Explore Resources
        </Link>
        <Link href="/project-planner" className="font-semibold text-accent-text hover:underline">
          Plan Your Project
        </Link>
      </p>
    </Container>
  );
}
