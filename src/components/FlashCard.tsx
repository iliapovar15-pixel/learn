"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Word } from "@/lib/words-data";
import { Word as WordEn } from "@/lib/words-data-en";
import { ChevronLeft, ChevronRight, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakSpanish } from "@/lib/words-store";
import { speakEnglish } from "@/lib/words-store-en";

type Language = "es" | "en";
type AnyWord = Word | WordEn;

interface FlashCardProps {
  words: AnyWord[];
  mode: "foreign-first" | "russian-first";
  lang: Language;
  onComplete: () => void;
  onBack?: () => void;
}

function getForeignWord(word: AnyWord, lang: Language): string {
  if (lang === "es") {
    return (word as Word).spanish;
  }
  return (word as WordEn).english;
}

export function FlashCard({ words, mode, lang, onComplete, onBack }: FlashCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  const currentWord = words[currentIndex];
  const isEnglish = lang === "en";

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setDirection(1);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (text: string) => {
    if (isEnglish) {
      speakEnglish(text);
    } else {
      speakSpanish(text);
    }
  };

  if (!currentWord) {
    return null;
  }

  const foreignWord = getForeignWord(currentWord, lang);
  
  const frontContent =
    mode === "foreign-first"
      ? { main: foreignWord, sub: currentWord.transcription }
      : { main: currentWord.russian, sub: "" };

  const backContent =
    mode === "foreign-first"
      ? { main: currentWord.russian, sub: "" }
      : { main: foreignWord, sub: currentWord.transcription };

  const modeLabel = mode === "foreign-first"
    ? (isEnglish ? "Английский → Русский" : "Испанский → Русский")
    : (isEnglish ? "Русский → Английский" : "Русский → Испанский");

  const textColor = isEnglish ? "text-blue-600" : "text-amber-600";
  const progressBg = isEnglish ? "bg-blue-100" : "bg-amber-100";
  const progressGradient = isEnglish ? "from-blue-400 to-indigo-500" : "from-amber-400 to-orange-500";
  const cardFrontBg = isEnglish ? "from-blue-50 to-indigo-50" : "from-amber-50 to-orange-50";
  const cardFrontBorder = isEnglish ? "border-blue-200" : "border-amber-200";
  const cardBackBg = isEnglish ? "from-indigo-100 to-blue-100" : "from-orange-100 to-amber-100";
  const cardBackBorder = isEnglish ? "border-indigo-300" : "border-orange-300";
  const titleColor = isEnglish ? "text-blue-900" : "text-amber-900";
  const subtextColor = isEnglish ? "text-blue-600" : "text-amber-600";
  const hintColor = isEnglish ? "text-blue-400" : "text-amber-400";
  const buttonHoverBg = isEnglish ? "bg-blue-100 hover:bg-blue-200" : "bg-amber-100 hover:bg-amber-200";
  const buttonIconColor = isEnglish ? "text-blue-700" : "text-amber-700";
  const buttonOutline = isEnglish ? "border-blue-300 text-blue-700 hover:bg-blue-50" : "border-amber-300 text-amber-700 hover:bg-amber-50";
  const buttonGradient = isEnglish ? "from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600" : "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md mb-6">
        <div className={`flex items-center justify-between text-sm ${textColor} mb-2`}>
          <span>{modeLabel}</span>
          <span>
            {currentIndex + 1} / {words.length}
          </span>
        </div>
        <div className={`h-2 ${progressBg} rounded-full overflow-hidden`}>
          <motion.div
            className={`h-full bg-gradient-to-r ${progressGradient}`}
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="perspective-1000 w-full max-w-md aspect-[3/2]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 100 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <motion.div
              className="w-full h-full cursor-pointer"
              onClick={handleFlip}
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5 }}
            >
                <div
                  className={`absolute w-full h-full rounded-3xl bg-gradient-to-br ${cardFrontBg} border-2 ${cardFrontBorder} shadow-xl flex flex-col items-center justify-center p-6`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {mode === "foreign-first" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSpeak(foreignWord); }}
                      className={`absolute top-4 right-4 p-2 rounded-full ${buttonHoverBg}`}
                    >
                      <Volume2 className={`w-5 h-5 ${buttonIconColor}`} />
                    </button>
                  )}
                  <span className={`text-4xl font-bold ${titleColor} mb-3 text-center`}>
                    {frontContent.main}
                  </span>
                  {frontContent.sub && (
                    <span className={`text-lg ${subtextColor}`}>{frontContent.sub}</span>
                  )}
                  <span className={`text-sm ${hintColor} mt-6`}>Нажмите для перевода</span>
                </div>
                <div
                  className={`absolute w-full h-full rounded-3xl bg-gradient-to-br ${cardBackBg} border-2 ${cardBackBorder} shadow-xl flex flex-col items-center justify-center p-6`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  {mode === "russian-first" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSpeak(foreignWord); }}
                      className={`absolute top-4 right-4 p-2 rounded-full ${isEnglish ? "bg-indigo-100 hover:bg-indigo-200" : "bg-orange-100 hover:bg-orange-200"}`}
                    >
                      <Volume2 className={`w-5 h-5 ${isEnglish ? "text-indigo-700" : "text-orange-700"}`} />
                    </button>
                  )}
                  <span className={`text-4xl font-bold ${isEnglish ? "text-indigo-900" : "text-orange-900"} mb-3 text-center`}>
                    {backContent.main}
                  </span>
                  {backContent.sub && (
                    <span className={`text-lg ${isEnglish ? "text-indigo-600" : "text-orange-600"}`}>{backContent.sub}</span>
                  )}
                </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 mt-8">
        {onBack && currentIndex === 0 && (
          <Button
            onClick={onBack}
            variant="outline"
            className={buttonOutline}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Назад
          </Button>
        )}
        <Button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          variant="outline"
          className={`${buttonOutline} disabled:opacity-50`}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleNext}
          className={`bg-gradient-to-r ${buttonGradient} text-white px-8`}
        >
          {currentIndex === words.length - 1 ? "Далее" : "Следующая"}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
