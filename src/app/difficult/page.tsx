export const dynamic = "force-dynamic";

import { Suspense } from "react";
import DifficultClient from "./DifficultClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DifficultClient />
    </Suspense>
  );
}
