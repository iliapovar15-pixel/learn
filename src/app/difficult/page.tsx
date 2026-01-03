"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Volume2, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Word, shuffleArray } from "../../lib/words-data";
import { Word as WordEn } from "../../lib/words-data-en";
import {
  getDifficultWordsWithData,
  removeDifficultWord,
  clearDifficultWords,
  speakSpanish,
} from "../../lib/words-store";
import * as storeEn from "../../lib/words-store-en";

type Language = "es" | "en";
type AnyWord = (Word | WordEn) & { errorCount: number };

function getForeignWord(word: AnyWord, lang: Language): string {
  if (lang === "es") {
    return (word as Word & { errorCount: number }).spanish;
  }
  return (word as WordEn & { errorCount: number }).english;
}

export default function DifficultPage() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get("lang") as Language) || "es";
  const isEnglish = lang === "en";

  const [difficultWords, setDifficultWords] = useState<AnyWord[]>([]);
  const [mode, setMode] = useState<"list" | "practice">("list");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const loadWords = () => {
    if (isEnglish) {
      setDifficultWords(storeEn.getDifficultWordsWithData());
    } else {
      setDifficultWords(getDifficultWordsWithData());
    }
  };

  useEffect(() => {
    loadWords();
  }, [isEnglish]);

  const handleRemoveWord = (wordId: string) => {
    if (isEnglish) {
      storeEn.removeDifficultWord(wordId);
    } else {
      removeDifficultWord(wordId);
    }
    loadWords();
  };

  const handleClearAll = () => {
    if (isEnglish) {
      storeEn.clearDifficultWords();
    } else {
      clearDifficultWords();
    }
    setDifficultWords([]);
  };

  const handleStartPractice = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMode("practice");
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    if (currentIndex < difficultWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setMode("list");
      loadWords();
    }
  };

  const handleSpeak = (text: string) => {
    if (isEnglish) {
      storeEn.speakEnglish(text);
    } else {
      speakSpanish(text);
    }
  };

  const handleMarkAsLearned = () => {
    const word = difficultWords[currentIndex];
    if (isEnglish) {
      storeEn.removeDifficultWord(word.id);
    } else {
      removeDifficultWord(word.id);
    }
    handleNextCard();
  };

  if (mode === "practice" && difficultWords.length > 0) {
    const word = difficultWords[currentIndex];
    const foreignWord = getForeignWord(word, lang);

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-lg mx-auto px-4 py-6">
          <header className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMode("list")}
              className="text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-red-900 dark:text-white">Практика</h1>
            <span className="ml-auto text-red-600 dark:text-red-400">
              {currentIndex + 1} / {difficultWords.length}
            </span>
          </header>

          <div className="w-full mb-4">
            <div className="h-2 bg-red-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-400 to-rose-500"
                animate={{ width: `${((currentIndex + 1) / difficultWords.length) * 100}%` }}
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
                  className="absolute w-full h-full rounded-3xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-200 dark:border-red-700 shadow-xl flex flex-col items-center justify-center p-6"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="absolute top-4 left-4 px-2 py-1 bg-red-100 dark:bg-red-900/50 rounded-full">
                    <span className="text-xs text-red-600 dark:text-red-400">Ошибок: {word.errorCount}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSpeak(foreignWord); }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-red-100 dark:bg-gray-700 hover:bg-red-200 dark:hover:bg-gray-600"
                  >
                    <Volume2 className="w-5 h-5 text-red-700 dark:text-red-400" />
                  </button>
                  <span className="text-4xl font-bold text-red-900 dark:text-white mb-3 text-center">
                    {foreignWord}
                  </span>
                  <span className="text-lg text-red-600 dark:text-red-400">{word.transcription}</span>
                  <span className="text-sm text-red-400 dark:text-red-500 mt-4">Нажмите для перевода</span>
                </div>
                <div
                  className="absolute w-full h-full rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 border-2 border-rose-200 dark:border-rose-700 shadow-xl flex flex-col items-center justify-center p-6"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <span className="text-4xl font-bold text-rose-900 dark:text-white text-center">
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
                  className="flex gap-3"
                >
                  <Button
                    onClick={handleMarkAsLearned}
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                  >
                    Выучил!
                  </Button>
                  <Button
                    onClick={handleNextCard}
                    className="bg-gradient-to-r from-red-500 to-rose-500 text-white"
                  >
                    Следующее
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-lg mx-auto px-4 py-6">
        <header className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-red-900 dark:text-white">Сложные слова</h1>
          <span className="ml-auto text-sm px-2 py-1 rounded bg-red-100 dark:bg-gray-700 text-red-700 dark:text-red-400">
            {isEnglish ? "🇬🇧" : "🇪🇸"}
          </span>
        </header>

        {difficultWords.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border-2 border-red-100 dark:border-gray-700 p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-300 dark:text-red-700 mb-4" />
            <h2 className="text-xl font-bold text-red-900 dark:text-white mb-2">Нет сложных слов</h2>
            <p className="text-red-600 dark:text-red-400 text-sm">
              Слова, в которых вы ошиблись во время тестов, появятся здесь
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <Button
                onClick={handleStartPractice}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Практика ({difficultWords.length})
              </Button>
              <Button
                onClick={handleClearAll}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {difficultWords.map((word) => {
                const foreignWord = getForeignWord(word, lang);
                return (
                  <motion.div
                    key={word.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-red-100 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSpeak(foreignWord)}
                        className="p-2 rounded-full bg-red-100 dark:bg-gray-700 hover:bg-red-200 dark:hover:bg-gray-600"
                      >
                        <Volume2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                      <div className="flex-1">
                        <p className="font-bold text-red-900 dark:text-white">{foreignWord}</p>
                        <p className="text-sm text-red-600 dark:text-red-400">{word.russian}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400">
                        {word.errorCount}x
                      </span>
                      <button
                        onClick={() => handleRemoveWord(word.id)}
                        className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-gray-700"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
