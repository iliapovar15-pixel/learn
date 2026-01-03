"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FlashCard } from "./FlashCard";
import { Quiz } from "./Quiz";
import { getCategoryName, WordCategory, shuffleArray, Word } from "../../lib/words-data";
import { Word as WordEn } from "../../lib/words-data-en";
import { getLessonWords, saveLessonProgress } from "../lib/words-store";
import * as storeEn from "../../lib/words-store-en";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import Link from "next/link";

type LessonStage = "foreign-first" | "russian-first" | "quiz" | "completed";
type Language = "es" | "en";

export function LessonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = (searchParams.get("category") as WordCategory) || "verbs";
  const lessonIndex = parseInt(searchParams.get("lesson") || "0", 10);
  const lang = (searchParams.get("lang") as Language) || "es";
  const [stage, setStage] = useState<LessonStage>("foreign-first");
  const [words, setWords] = useState<(Word | WordEn)[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [finalScore, setFinalScore] = useState({ score: 0, total: 0 });

  useEffect(() => {
    const lessonWords = lang === "es" 
      ? getLessonWords(category, lessonIndex)
      : storeEn.getLessonWords(category, lessonIndex);
    setWords(shuffleArray(lessonWords as (Word | WordEn)[]));
    setIsReady(true);
  }, [category, lessonIndex, lang]);

  const categoryName = getCategoryName(category);
  const isEnglish = lang === "en";

  const stages: { key: LessonStage; label: string; number: number }[] = [
    { key: "foreign-first", label: isEnglish ? "Английский → Русский" : "Испанский → Русский", number: 1 },
    { key: "russian-first", label: isEnglish ? "Русский → Английский" : "Русский → Испанский", number: 2 },
    { key: "quiz", label: "Тест", number: 3 },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === stage);

  const handleStageComplete = () => {
    if (stage === "foreign-first") {
      setStage("russian-first");
    } else if (stage === "russian-first") {
      setStage("quiz");
    }
  };

  const handleQuizComplete = (score: number, total: number) => {
    setFinalScore({ score, total });
    if (lang === "es") {
      saveLessonProgress(category, lessonIndex, score, total);
    } else {
      storeEn.saveLessonProgress(category, lessonIndex, score, total);
    }
    setStage("completed");
  };

  const handleBackToCategory = () => {
    router.push(`/category?category=${category}&lang=${lang}`);
  };

  const handleNextLesson = () => {
    router.push(`/lesson?category=${category}&lesson=${lessonIndex + 1}&lang=${lang}`);
  };

  const bgGradient = isEnglish 
    ? "from-blue-50 via-indigo-50 to-cyan-50" 
    : "from-amber-50 via-orange-50 to-yellow-50";
  const headerBg = isEnglish ? "border-blue-100" : "border-amber-100";
  const textColor = isEnglish ? "text-blue-700" : "text-amber-700";
  const hoverBg = isEnglish ? "hover:bg-blue-100" : "hover:bg-amber-100";
  const titleColor = isEnglish ? "text-blue-900" : "text-amber-900";
  const subtextColor = isEnglish ? "text-blue-600" : "text-amber-600";
  const progressGradient = isEnglish 
    ? "from-blue-500 to-indigo-500" 
    : "from-amber-500 to-orange-500";
  const buttonOutline = isEnglish 
    ? "border-blue-300 text-blue-700 hover:bg-blue-50" 
    : "border-amber-300 text-amber-700 hover:bg-amber-50";
  const buttonGradient = isEnglish 
    ? "from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600" 
    : "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600";
  const progressBg = isEnglish ? "bg-blue-100" : "bg-amber-100";

  if (!isReady) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${bgGradient} flex items-center justify-center`}>
        <div className="animate-pulse">
          <div className={`w-16 h-16 rounded-full ${isEnglish ? "bg-blue-200" : "bg-amber-200"}`}></div>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${bgGradient} flex flex-col items-center justify-center p-4`}>
        <p className={textColor + " mb-4"}>Урок не найден</p>
        <Button onClick={handleBackToCategory}>Назад к категории</Button>
      </div>
    );
  }

  if (stage === "completed") {
    const percentage = Math.round((finalScore.score / finalScore.total) * 100);
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`min-h-screen bg-gradient-to-br ${bgGradient} flex flex-col items-center justify-center p-4`}
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-8xl mb-6"
          >
            {percentage >= 80 ? "🎉" : percentage >= 50 ? "👍" : "📚"}
          </motion.div>
          <h1 className={`text-3xl font-bold ${titleColor} mb-2`}>Урок {lessonIndex + 1} завершен!</h1>
          <p className={`text-xl ${textColor} mb-2`}>{categoryName}</p>
          <p className={`text-2xl font-bold ${titleColor} mb-8`}>
            Результат: {finalScore.score}/{finalScore.total} ({percentage}%)
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => {
                setStage("foreign-first");
                setWords(shuffleArray(words));
              }}
              variant="outline"
              className={buttonOutline}
            >
              Пройти снова
            </Button>
            <Button
              onClick={handleBackToCategory}
              variant="outline"
              className={buttonOutline}
            >
              К списку уроков
            </Button>
            <Button
              onClick={handleNextLesson}
              className={`bg-gradient-to-r ${buttonGradient} text-white`}
            >
              Следующий урок
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient}`}>
      <header className={`sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b ${headerBg}`}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href={`/category?category=${category}&lang=${lang}`}>
              <Button variant="ghost" size="sm" className={`${textColor} ${hoverBg}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </Link>
            <div className="text-center">
              <h1 className={`text-lg font-bold ${titleColor}`}>Урок {lessonIndex + 1}</h1>
              <p className={`text-xs ${subtextColor}`}>{categoryName}</p>
            </div>
            <div className="w-20" />
          </div>

          <div className="flex items-center justify-center gap-2">
            {stages.map((s, index) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    index < currentStageIndex
                      ? "bg-green-500 text-white"
                      : index === currentStageIndex
                      ? `bg-gradient-to-r ${progressGradient} text-white`
                      : `${progressBg} ${isEnglish ? "text-blue-400" : "text-amber-400"}`
                  }`}
                >
                  {index < currentStageIndex ? "✓" : s.number}
                </div>
                {index < stages.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-1 rounded ${
                      index < currentStageIndex ? "bg-green-500" : progressBg
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className={`text-sm ${subtextColor}`}>
              {stages[currentStageIndex]?.label}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {stage === "foreign-first" && words.length > 0 && (
          <FlashCard
            words={words}
            mode="foreign-first"
            lang={lang}
            onComplete={handleStageComplete}
            onBack={handleBackToCategory}
          />
        )}
        {stage === "russian-first" && words.length > 0 && (
          <FlashCard
            words={words}
            mode="russian-first"
            lang={lang}
            onComplete={handleStageComplete}
          />
        )}
        {stage === "quiz" && words.length > 0 && (
          <Quiz words={words} lang={lang} onComplete={handleQuizComplete} />
        )}
      </main>
    </div>
  );
}
