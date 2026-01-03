"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Volume2, Clock, Brain, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Word, shuffleArray } from "../../lib/words-data";
import { Word as WordEn } from "../../lib/words-data-en";
import {
  getWordsForReview,
  getReviewCount,
  updateSRS,
  speakSpanish,
  getStoredWords,
  getSRSData,
  initializeSRS,
  saveSRSData,
} from "../../lib/words-store";
import * as storeEn from "../../lib/words-store-en";

type Mode = "info" | "review";
type Language = "es" | "en";
type AnyWord = Word | WordEn;

function getForeignWord(word: AnyWord, lang: Language): string {
  if (lang === "es") {
    return (word as Word).spanish;
  }
  return (word as WordEn).english;
}

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get("lang") as Language) || "es";
  const isEnglish = lang === "en";

  const [wordsToReview, setWordsToReview] = useState<AnyWord[]>([]);
  const [mode, setMode] = useState<Mode>("info");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (isEnglish) {
      setReviewCount(storeEn.getReviewCount());
      setWordsToReview(shuffleArray(storeEn.getWordsForReview()));
    } else {
      setReviewCount(getReviewCount());
      setWordsToReview(shuffleArray(getWordsForReview()));
    }
  }, [isEnglish]);

  const handleStartReview = () => {
    if (isEnglish) {
      const words = storeEn.getWordsForReview();
      if (words.length === 0) {
        const allWords = storeEn.getStoredWords();
        const srsData = storeEn.getSRSData();
        const newWords = allWords.filter(w => !srsData.find(s => s.wordId === w.id)).slice(0, 10);
        newWords.forEach(w => {
          const data = storeEn.initializeSRS(w.id);
          srsData.push(data);
        });
        storeEn.saveSRSData(srsData);
        setWordsToReview(shuffleArray(newWords));
      } else {
        setWordsToReview(shuffleArray(words));
      }
    } else {
      const words = getWordsForReview();
      if (words.length === 0) {
        const allWords = getStoredWords();
        const srsData = getSRSData();
        const newWords = allWords.filter(w => !srsData.find(s => s.wordId === w.id)).slice(0, 10);
        newWords.forEach(w => {
          const data = initializeSRS(w.id);
          srsData.push(data);
        });
        saveSRSData(srsData);
        setWordsToReview(shuffleArray(newWords));
      } else {
        setWordsToReview(shuffleArray(words));
      }
    }
    setCurrentIndex(0);
    setCompleted(0);
    setMode("review");
  };

  const handleRate = (quality: number) => {
    const word = wordsToReview[currentIndex];
    if (isEnglish) {
      storeEn.updateSRS(word.id, quality);
    } else {
      updateSRS(word.id, quality);
    }
    setCompleted(completed + 1);
    setIsFlipped(false);

    if (currentIndex < wordsToReview.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setMode("info");
      setReviewCount(isEnglish ? storeEn.getReviewCount() : getReviewCount());
    }
  };

  const handleSpeak = (text: string) => {
    if (isEnglish) {
      storeEn.speakEnglish(text);
    } else {
      speakSpanish(text);
    }
  };

  const bgGradient = "from-purple-50 via-violet-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900";

  if (mode === "review" && wordsToReview.length > 0) {
    const word = wordsToReview[currentIndex];
    const foreignWord = getForeignWord(word, lang);
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${bgGradient}`}>
        <div className="max-w-lg mx-auto px-4 py-6">
          <header className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMode("info")}
              className="text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-violet-900 dark:text-white">Повторение</h1>
            <span className="ml-auto text-violet-600 dark:text-violet-400">
              {currentIndex + 1} / {wordsToReview.length}
            </span>
          </header>

          <div className="w-full mb-4">
            <div className="h-2 bg-violet-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-400 to-purple-500"
                animate={{ width: `${((currentIndex + 1) / wordsToReview.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center">
            <motion.div
              className="w-full aspect-[3/2] cursor-pointer mb-8"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="absolute w-full h-full rounded-3xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border-2 border-violet-200 dark:border-violet-700 shadow-xl flex flex-col items-center justify-center p-6"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSpeak(foreignWord); }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-violet-100 dark:bg-gray-700 hover:bg-violet-200 dark:hover:bg-gray-600"
                  >
                    <Volume2 className="w-5 h-5 text-violet-700 dark:text-violet-400" />
                  </button>
                  <span className="text-4xl font-bold text-violet-900 dark:text-white mb-3 text-center">
                    {foreignWord}
                  </span>
                  <span className="text-lg text-violet-600 dark:text-violet-400">{word.transcription}</span>
                  <span className="text-sm text-violet-400 dark:text-violet-500 mt-4">Нажмите для перевода</span>
                </div>
                <div
                  className="absolute w-full h-full rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border-2 border-indigo-200 dark:border-indigo-700 shadow-xl flex flex-col items-center justify-center p-6"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <span className="text-4xl font-bold text-indigo-900 dark:text-white text-center">
                    {word.russian}
                  </span>
                </div>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex flex-col items-center gap-3"
                >
                  <p className="text-sm text-violet-600 dark:text-violet-400 mb-2">Как хорошо запомнили?</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRate(1)}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                    >
                      Не помню
                    </Button>
                    <Button
                      onClick={() => handleRate(3)}
                      variant="outline"
                      className="border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                    >
                      Сложно
                    </Button>
                    <Button
                      onClick={() => handleRate(4)}
                      variant="outline"
                      className="border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                    >
                      Хорошо
                    </Button>
                    <Button
                      onClick={() => handleRate(5)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    >
                      Легко!
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient}`}>
      <div className="max-w-lg mx-auto px-4 py-6">
        <header className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-violet-900 dark:text-white">Повторение</h1>
          <span className="ml-auto text-sm px-2 py-1 rounded bg-violet-100 dark:bg-gray-700 text-violet-700 dark:text-violet-400">
            {isEnglish ? "🇬🇧" : "🇪🇸"}
          </span>
        </header>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border-2 border-violet-100 dark:border-gray-700 p-6 text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl flex items-center justify-center">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-violet-900 dark:text-white mb-2">
            Интервальное повторение
          </h2>
          <p className="text-violet-600 dark:text-violet-400 text-sm mb-4">
            Система запоминания, которая показывает слова в оптимальные моменты
          </p>
          
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-violet-500">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-violet-900 dark:text-white">{reviewCount}</p>
              <p className="text-xs text-violet-500">К повторению</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-500">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-violet-900 dark:text-white">{completed}</p>
              <p className="text-xs text-violet-500">Сегодня</p>
            </div>
          </div>

          <Button
            onClick={handleStartReview}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600"
          >
            {reviewCount > 0 ? `Повторить (${reviewCount})` : "Начать изучение"}
          </Button>
        </div>

        <div className="bg-violet-50/50 dark:bg-gray-800/50 rounded-2xl p-4">
          <h3 className="font-bold text-violet-900 dark:text-white mb-2">Как это работает?</h3>
          <ul className="text-sm text-violet-600 dark:text-violet-400 space-y-2">
            <li>• Слова показываются через увеличивающиеся интервалы</li>
            <li>• Если забыли — интервал сбрасывается</li>
            <li>• Если помните — следующее повторение позже</li>
            <li>• Оптимизировано для долгосрочной памяти</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
