"use client";

import dynamic from "next/dynamic";
import ProgressLoading from "@/components/progress/ProgressLoading";

const ProgressClient = dynamic(
  () => import("@/components/progress/ProgressClient"),
  {
    ssr: false,
    loading: () => <ProgressLoading />,
  },
);

export default function ProgressClientLazy() {
  return <ProgressClient />;
}
