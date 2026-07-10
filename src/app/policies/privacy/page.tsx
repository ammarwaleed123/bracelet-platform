import type { Metadata } from "next";

import { policies } from "@/content/pages";
import { PolicyPage } from "@/components/pages/policy-page";

export const metadata: Metadata = { title: policies.privacy.title };

export default function PrivacyPolicyPage() {
  return <PolicyPage {...policies.privacy} />;
}
