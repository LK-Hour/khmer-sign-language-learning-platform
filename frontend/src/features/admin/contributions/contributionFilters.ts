/** Shared status-filter helpers for the admin contribution review views. */

export type ContributionStatusFilter = "all" | "pending" | "approved" | "rejected";

/** Filter contributions by status. When filter is "all", all contributions pass. */
export function filterContributionsByStatus<T extends { status: string }>(
  contributions: T[],
  status: ContributionStatusFilter,
): T[] {
  if (status === "all") return contributions;
  return contributions.filter((c) => c.status === status);
}
