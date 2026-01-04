import { Suspense } from "react";
import WritingClient from "./WritingClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WritingClient />
    </Suspense>
  );
}
