import type { Metadata } from "next";

import { policies } from "@/content/pages";
import { PolicyPage } from "@/components/pages/policy-page";

export const metadata: Metadata = { title: policies.returns.title };

export default function ReturnsPolicyPage() {
  return <PolicyPage {...policies.returns} />;
}
