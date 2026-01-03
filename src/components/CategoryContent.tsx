"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Check, Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WordCategory, getCategoryName, getCategoryEmoji } from "@/lib/words-data";
import { getLessonsForCategory, getLessonProgress, LessonProgress } from "@/lib/words-store";
import * as storeEn from "@/lib/words-store-en";

type Language = "es" | "en";

export function CategoryContent() {
  const searchParams = useSearchParams();
  const category = (searchParams.get("category") as WordCategory) || "verbs";
  const lang = (searchParams.get("lang") as Language) || "es";
  const [lessonCount, setLessonCount] = useState(0);
  const [progress, setProgress] = useState<Record<number, LessonProgress | null>>({});

  useEffect(() => {
    const lessons = lang === "es" 
      ? getLessonsForCategory(category)
      : storeEn.getLessonsForCategory(category);
    setLessonCount(lessons.length);
    
    const progressMap: Record<number, LessonProgress | null> = {};
    for (let i = 0; i < lessons.length; i++) {
      progressMap[i] = lang === "es" 
        ? getLessonProgress(category, i)
        : storeEn.getLessonProgress(category, i);
    }
    setProgress(progressMap);
  }, [category, lang]);

  const categoryName = getCategoryName(category);
  const categoryEmoji = getCategoryEmoji(category);

  const completedLessons = Object.values(progress).filter(p => p?.completed).length;

  const isEnglish = lang === "en";
  const bgGradient = isEnglish 
    ? "from-blue-50 via-indigo-50 to-cyan-50" 
    : "from-amber-50 via-orange-50 to-yellow-50";
  const blob1 = isEnglish ? "bg-blue-200/30" : "bg-amber-200/30";
  const blob2 = isEnglish ? "bg-indigo-200/30" : "bg-orange-200/30";
  const textColor = isEnglish ? "text-blue-700" : "text-amber-700";
  const hoverBg = isEnglish ? "hover:bg-blue-100" : "hover:bg-amber-100";
  const titleColor = isEnglish ? "text-blue-900" : "text-amber-900";
  const subtextColor = isEnglish ? "text-blue-600" : "text-amber-600";
  const progressBg = isEnglish ? "bg-blue-100" : "bg-amber-100";
  const progressGradient = isEnglish 
    ? "from-blue-400 to-indigo-500" 
    : "from-amber-400 to-orange-500";
  const cardBorder = isEnglish ? "border-blue-200 hover:border-blue-400" : "border-amber-200 hover:border-amber-400";
  const buttonGradient = isEnglish 
    ? "from-blue-500 to-indigo-500" 
    : "from-amber-500 to-orange-500";

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 ${blob1} rounded-full blur-3xl`} />
        <div className={`absolute bottom-20 right-20 w-96 h-96 ${blob2} rounded-full blur-3xl`} />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-6">
        <header className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className={`${textColor} ${hoverBg}`}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{categoryEmoji}</span>
            <div>
              <h1 className={`text-xl font-bold ${titleColor}`}>{categoryName}</h1>
              <p className={`text-sm ${subtextColor}`}>
                {completedLessons} из {lessonCount} уроков пройдено
              </p>
            </div>
          </div>
        </header>

        <div className="mb-6">
          <div className={`h-3 ${progressBg} rounded-full overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: lessonCount > 0 ? `${(completedLessons / lessonCount) * 100}%` : '0%' }}
              transition={{ duration: 0.5 }}
              className={`h-full bg-gradient-to-r ${progressGradient}`}
            />
          </div>
        </div>

        {lessonCount === 0 ? (
          <div className="text-center py-12">
            <BookOpen className={`w-16 h-16 mx-auto ${isEnglish ? "text-blue-300" : "text-amber-300"} mb-4`} />
            <p className={`${subtextColor} mb-4`}>В этой категории пока нет слов</p>
            <Link href="/settings">
              <Button className={`bg-gradient-to-r ${buttonGradient} text-white`}>
                Импортировать слова
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: lessonCount }, (_, index) => {
              const lessonProgress = progress[index];
              const isCompleted = lessonProgress?.completed;
              const score = lessonProgress?.score;
              const total = lessonProgress?.total;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/lesson?category=${category}&lesson=${index}&lang=${lang}`}>
                    <div
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                        isCompleted
                          ? "bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300"
                          : `bg-white/80 border-2 ${cardBorder}`
                      }`}
                    >
                      {isCompleted && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      <span
                        className={`text-2xl font-bold ${
                          isCompleted ? "text-green-700" : titleColor
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`text-xs mt-1 ${
                          isCompleted ? "text-green-600" : isEnglish ? "text-blue-500" : "text-amber-500"
                        }`}
                      >
                        Урок
                      </span>
                      {isCompleted && score !== undefined && total !== undefined && (
                        <span className="text-xs text-green-600 mt-1">
                          {Math.round((score / total) * 100)}%
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
