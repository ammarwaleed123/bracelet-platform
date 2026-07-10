import type { Metadata } from "next";

import { policies } from "@/content/pages";
import { PolicyPage } from "@/components/pages/policy-page";

export const metadata: Metadata = { title: policies.shipping.title };

export default function ShippingPolicyPage() {
  return <PolicyPage {...policies.shipping} />;
}
