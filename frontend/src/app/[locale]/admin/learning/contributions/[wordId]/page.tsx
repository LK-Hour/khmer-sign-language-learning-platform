import { notFound } from "next/navigation";

import ContributionCardGrid from "@/features/admin/contributions/ContributionCardGrid";

type PageProps = {
  params: Promise<{ wordId: string }>;
};

export default async function ContributionWordPage({ params }: PageProps) {
  const { wordId } = await params;
  const id = Number(wordId);
  if (Number.isNaN(id)) notFound();

  return <ContributionCardGrid wordId={id} />;
}
