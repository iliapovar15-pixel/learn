"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Volume2, Check, X, PenTool, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Word, shuffleArray, WordCategory } from "../../lib/words-data";
import { Word as WordEn } from "../../lib/words-data-en";
import { getStoredWords, speakSpanish } from "../../lib/words-store";
import * as storeEn from "../../lib/words-store-en";

type Language = "es" | "en";
type AnyWord = Word | WordEn;

function getForeignWord(word: AnyWord, lang: Language): string {
  if (lang === "es") {
    return (word as Word).spanish;
  }
  return (word as WordEn).english;
}

export default function WritingPage() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get("lang") as Language) || "es";
  const isEnglish = lang === "en";

  const [words, setWords] = useState<AnyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const allWords = isEnglish ? storeEn.getStoredWords() : getStoredWords();
    setWords(shuffleArray(allWords as AnyWord[]).slice(0, 10));
  }, [isEnglish]);

  const currentWord = words[currentIndex];

  const handleSpeak = (text: string) => {
    if (isEnglish) {
      storeEn.speakEnglish(text);
    } else {
      speakSpanish(text);
    }
  };

  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const handleCheck = () => {
    if (!currentWord || isChecked) return;

    const foreignWord = getForeignWord(currentWord, lang);
    const correct = normalizeString(userInput) === normalizeString(foreignWord);
    setIsCorrect(correct);
    setIsChecked(true);
    setScore({
      correct: score.correct + (correct ? 1 : 0),
      total: score.total + 1,
    });
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setIsChecked(false);
      setShowHint(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleRestart = () => {
    const allWords = isEnglish ? storeEn.getStoredWords() : getStoredWords();
    setWords(shuffleArray(allWords as AnyWord[]).slice(0, 10));
    setCurrentIndex(0);
    setUserInput("");
    setIsChecked(false);
    setShowHint(false);
    setScore({ correct: 0, total: 0 });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!isChecked) {
        handleCheck();
      } else if (currentIndex < words.length - 1) {
        handleNext();
      }
    }
  };

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-full bg-teal-200 dark:bg-teal-800"></div>
        </div>
      </div>
    );
  }

  if (currentIndex >= words.length) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border-2 border-teal-100 dark:border-gray-700 p-8 text-center">
            <div className="text-6xl mb-4">
              {percentage >= 80 ? "🎉" : percentage >= 50 ? "👍" : "📝"}
            </div>
            <h2 className="text-2xl font-bold text-teal-900 dark:text-white mb-2">Практика завершена!</h2>
            <p className="text-xl text-teal-600 dark:text-teal-400 mb-4">
              {score.correct} из {score.total} ({percentage}%)
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400">
                  На главную
                </Button>
              </Link>
              <Button
                onClick={handleRestart}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Ещё раз
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const foreignWord = getForeignWord(currentWord, lang);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-lg mx-auto px-4 py-6">
        <header className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-teal-700 hover:bg-teal-100 dark:text-teal-400 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h1 className="text-xl font-bold text-teal-900 dark:text-white">Письмо</h1>
          </div>
          <span className="ml-auto text-sm px-2 py-1 rounded bg-teal-100 dark:bg-gray-700 text-teal-700 dark:text-teal-400">
            {isEnglish ? "🇬🇧" : "🇪🇸"}
          </span>
        </header>

        <div className="w-full mb-6">
          <div className="flex items-center justify-between text-sm text-teal-600 dark:text-teal-400 mb-2">
            <span>Прогресс</span>
            <span>{currentIndex + 1} / {words.length}</span>
          </div>
          <div className="h-2 bg-teal-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-500"
              animate={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-green-600">Правильно: {score.correct}</span>
            <span className="text-red-600">Ошибки: {score.total - score.correct}</span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border-2 border-teal-100 dark:border-gray-700 p-6 mb-4">
          <p className="text-sm text-teal-600 dark:text-teal-400 mb-2">
            {isEnglish ? "Напишите на английском:" : "Напишите на испанском:"}
          </p>
          <p className="text-3xl font-bold text-teal-900 dark:text-white text-center mb-4">
            {currentWord.russian}
          </p>

          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isChecked}
              placeholder={isEnglish ? "Type in English..." : "Escribe en español..."}
              className={`text-lg text-center py-6 ${
                isChecked
                  ? isCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                    : "border-red-500 bg-red-50 dark:bg-red-900/30"
                  : "border-teal-200 dark:border-gray-600"
              }`}
              autoFocus
            />
            {isChecked && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCorrect ? (
                  <Check className="w-6 h-6 text-green-500" />
                ) : (
                  <X className="w-6 h-6 text-red-500" />
                )}
              </div>
            )}
          </div>

          <AnimatePresence>
            {isChecked && !isCorrect && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-xl"
              >
                <p className="text-sm text-red-600 dark:text-red-400 mb-1">Правильный ответ:</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xl font-bold text-red-900 dark:text-red-300">{foreignWord}</p>
                  <button
                    onClick={() => handleSpeak(foreignWord)}
                    className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                  >
                    <Volume2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                </div>
                <p className="text-sm text-red-500 dark:text-red-400 text-center">{currentWord.transcription}</p>
              </motion.div>
            )}
            {isChecked && isCorrect && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl"
              >
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xl font-bold text-green-900 dark:text-green-300">{foreignWord}</p>
                  <button
                    onClick={() => handleSpeak(foreignWord)}
                    className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50"
                  >
                    <Volume2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </button>
                </div>
                <p className="text-sm text-green-500 dark:text-green-400 text-center">{currentWord.transcription}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!isChecked && !showHint && (
            <button
              onClick={() => setShowHint(true)}
              className="w-full mt-4 text-sm text-teal-500 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              Показать подсказку
            </button>
          )}

          {showHint && !isChecked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-2 bg-teal-50 dark:bg-teal-900/30 rounded-xl text-center"
            >
              <p className="text-sm text-teal-600 dark:text-teal-400">
                {currentWord.transcription} • {foreignWord.slice(0, Math.ceil(foreignWord.length / 2))}...
              </p>
            </motion.div>
          )}
        </div>

        <div className="flex gap-3">
          {!isChecked ? (
            <Button
              onClick={handleCheck}
              disabled={!userInput.trim()}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white disabled:opacity-50"
            >
              Проверить
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
            >
              {currentIndex < words.length - 1 ? "Далее" : "Завершить"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
