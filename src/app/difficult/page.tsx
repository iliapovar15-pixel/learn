import { Suspense } from "react";
import DifficultClient from "./DifficultClient";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: {
    lang?: "es" | "en";
  };
};

export default function Page({ searchParams }: PageProps) {
  const lang = searchParams.lang ?? "es";

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DifficultClient lang={lang} />
    </Suspense>
  );
}
