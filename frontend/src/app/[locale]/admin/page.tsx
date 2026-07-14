import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

export default async function AdminIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}${ROUTES.admin.analytics}`);
}
