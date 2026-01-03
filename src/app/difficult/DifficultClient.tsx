"use client";

import { useEffect, useState } from "react";
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

export default function DifficultClient() {
  // 🔴 ВАЖНО: БЕЗ useSearchParams
  const lang: Language = "es";
  const isEnglish = false;

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
  }, []);

  const getForeignWord = (word: AnyWord) =>
    isEnglish ? (word as WordEn).english : (word as Word).spanish;

  const handleRemoveWord = (id: string) => {
    isEnglish ? storeEn.removeDifficultWord(id) : removeDifficultWord(id);
    loadWords();
  };

  const handleClearAll = () => {
    isEnglish ? storeEn.clearDifficultWords() : clearDifficultWords();
    setDifficultWords([]);
  };

  const handleSpeak = (text: string) => {
    isEnglish ? storeEn.speakEnglish(text) : speakSpanish(text);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < difficultWords.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setMode("list");
      loadWords();
    }
  };

  if (mode === "practice" && difficultWords.length > 0) {
    const word = difficultWords[currentIndex];
    const foreignWord = getForeignWord(word);

    return (
      <div className="min-h-screen p-6">
        <Button onClick={() => setMode("list")}>
          <ArrowLeft /> Назад
        </Button>

        <motion.div
          className="mt-10 p-10 border rounded-xl cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {isFlipped ? word.russian : foreignWord}
        </motion.div>

        <div className="mt-4 flex gap-2">
          <Button onClick={() => handleSpeak(foreignWord)}>
            <Volume2 />
          </Button>
          <Button onClick={handleNext}>Дальше</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <Link href="/">
        <Button>
          <ArrowLeft /> Назад
        </Button>
      </Link>

      <h1 className="text-2xl mt-6 mb-4">Сложные слова</h1>

      {difficultWords.length === 0 ? (
        <div className="text-gray-500 flex gap-2 items-center">
          <AlertTriangle /> Нет слов
        </div>
      ) : (
        <>
          <Button onClick={() => setMode("practice")}>
            <RefreshCw /> Практика
          </Button>

          <Button onClick={handleClearAll} className="ml-2">
            <Trash2 /> Очистить
          </Button>

          <ul className="mt-4 space-y-2">
            {difficultWords.map((w) => (
              <li
                key={w.id}
                className="border p-3 rounded flex justify-between"
              >
                <span>{getForeignWord(w)}</span>
                <Button onClick={() => handleRemoveWord(w.id)}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
