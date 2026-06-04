"use client";

import Link from "next/link";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";

type StartExerciseLinkProps = {
  href: string;
  label?: string;
};

export default function StartExerciseLink({
  href,
  label = "Start exercise",
}: StartExerciseLinkProps) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <PrimaryActionButton label={label} />
    </Link>
  );
}
