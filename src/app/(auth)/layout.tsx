import { Container } from "@/components/layout/container";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container className="flex justify-center py-20">
      <div className="w-full max-w-sm">{children}</div>
    </Container>
  );
}
