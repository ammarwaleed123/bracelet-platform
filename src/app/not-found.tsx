import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-32 text-center">
      <p className="label-caps">Error 404</p>
      <h1 className="mt-4 font-serif text-4xl text-ink">
        This page slipped off the wrist.
      </h1>
      <p className="mt-4 max-w-md text-ink-soft">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back home</Link>
      </Button>
    </Container>
  );
}
