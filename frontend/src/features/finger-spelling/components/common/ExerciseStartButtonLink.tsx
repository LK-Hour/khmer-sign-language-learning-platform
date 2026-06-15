"use client";

import Link from "next/link";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";

type ExerciseStartButtonLinkProps = {
  href: string;
  label?: string;
};

export default function ExerciseStartButtonLink({
  href,
  label,
}: ExerciseStartButtonLinkProps) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <PrimaryActionButton label={label ?? "Confirm"} />
    </Link>
  );
}
