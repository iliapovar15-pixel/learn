import { Suspense } from "react";
import { CategoryContent } from "../../components/CategoryContent";

function CategoryLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-16 h-16 rounded-full bg-amber-200"></div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<CategoryLoading />}>
      <CategoryContent />
    </Suspense>
  );
}
