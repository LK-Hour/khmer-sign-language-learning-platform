import { notFound } from "next/navigation";

import ContributionReviewPage from "@/features/admin/contributions/ContributionReviewPage";

type PageProps = {
  params: Promise<{ wordId: string }>;
};

export default async function ContributionReviewRoute({ params }: PageProps) {
  const { wordId } = await params;
  if (!wordId) notFound();

  return <ContributionReviewPage contributionId={wordId} />;
}
