"use client";

import dynamic from "next/dynamic";

const DifficultClient = dynamic(
  () => import("./DifficultClient"),
  { ssr: false }
);

export default function Page() {
  return <DifficultClient />;
}
