"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Word, shuffleArray } from ""../lib/words-data";
import { Word as WordEn } from "@/lib/words-data-en";
import { Button } from "./ui/button";
import { Check, X, Trophy, Volume2 } from "lucide-react";
import { markWordAsDifficult, updateSRS, speakSpanish } from "../lib/words-store";
import * as storeEn from "@/lib/words-store-en";

type Language = "es" | "en";
type AnyWord = Word | WordEn;

interface QuizProps {
  words: AnyWord[];
  lang: Language;
  onComplete: (score: number, total: number) => void;
}

interface QuizQuestion {
  word: AnyWord;
  options: string[];
  correctAnswer: string;
  type: "foreign-to-russian" | "russian-to-foreign";
}

function getForeignWord(word: AnyWord, lang: Language): string {
  if (lang === "es") {
    return (word as Word).spanish;
  }
  return (word as WordEn).english;
}

export function Quiz({ words, lang, onComplete }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const isEnglish = lang === "en";

  const questions: QuizQuestion[] = useMemo(() => {
    const shuffledWords = shuffleArray(words);
    return shuffledWords.map((word, index) => {
      const type = index % 2 === 0 ? "foreign-to-russian" : "russian-to-foreign";
      const foreignWord = getForeignWord(word, lang);
      const correctAnswer = type === "foreign-to-russian" ? word.russian : foreignWord;
      const otherWords = words.filter((w) => w.id !== word.id);
      const wrongAnswers = shuffleArray(otherWords)
        .slice(0, 3)
        .map((w) => (type === "foreign-to-russian" ? w.russian : getForeignWord(w, lang)));
      const options = shuffleArray([correctAnswer, ...wrongAnswers]);
      return { word, options, correctAnswer, type };
    });
  }, [words, lang]);

  const currentQuestion = questions[currentIndex];

  const handleSpeak = (text: string) => {
    if (isEnglish) {
      storeEn.speakEnglish(text);
    } else {
      speakSpanish(text);
    }
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    if (correct) {
      setScore((prev) => prev + 1);
      if (isEnglish) {
        storeEn.updateSRS(currentQuestion.word.id, 5);
      } else {
        updateSRS(currentQuestion.word.id, 5);
      }
    } else {
      if (isEnglish) {
        storeEn.markWordAsDifficult(currentQuestion.word.id);
        storeEn.updateSRS(currentQuestion.word.id, 1);
      } else {
        markWordAsDifficult(currentQuestion.word.id);
        updateSRS(currentQuestion.word.id, 1);
      }
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
      }
    }, 1000);
  };

  const textColor = isEnglish ? "text-blue-600" : "text-amber-600";
  const progressBg = isEnglish ? "bg-blue-100" : "bg-amber-100";
  const progressGradient = isEnglish ? "from-blue-400 to-indigo-500" : "from-amber-400 to-orange-500";
  const cardBg = isEnglish ? "from-blue-50 to-indigo-50" : "from-amber-50 to-orange-50";
  const cardBorder = isEnglish ? "border-blue-200" : "border-amber-200";
  const titleColor = isEnglish ? "text-blue-900" : "text-amber-900";
  const iconColor = isEnglish ? "text-blue-500" : "text-amber-500";
  const buttonGradient = isEnglish ? "from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600" : "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600";
  const cardHover = isEnglish ? "border-blue-200 hover:border-blue-400 hover:bg-blue-50" : "border-amber-200 hover:border-amber-400 hover:bg-amber-50";

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[70vh] px-4"
      >
        <div className={`bg-gradient-to-br ${cardBg} border-2 ${cardBorder} rounded-3xl p-8 max-w-md w-full text-center shadow-xl`}>
          <Trophy className={`w-20 h-20 mx-auto ${iconColor} mb-4`} />
          <h2 className={`text-3xl font-bold ${titleColor} mb-2`}>Урок завершен!</h2>
          <p className={`text-xl ${textColor} mb-4`}>
            Ваш результат: {score} из {questions.length}
          </p>
          <div className={`h-4 ${progressBg} rounded-full overflow-hidden mb-4`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className={`h-full ${
                percentage >= 80
                  ? "bg-green-500"
                  : percentage >= 50
                  ? isEnglish ? "bg-blue-500" : "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
          </div>
          <p className={`text-2xl font-bold ${titleColor}`}>{percentage}%</p>
          <p className={`${textColor} mt-2`}>
            {percentage >= 80
              ? "Отлично! Вы отлично справились!"
              : percentage >= 50
              ? "Хорошо! Продолжайте практиковаться!"
              : "Попробуйте еще раз!"}
          </p>
          <Button
            onClick={() => onComplete(score, questions.length)}
            className={`mt-6 bg-gradient-to-r ${buttonGradient} text-white`}
          >
            Завершить
          </Button>
        </div>
      </motion.div>
    );
  }

  const foreignWord = getForeignWord(currentQuestion.word, lang);
  const translateLabel = currentQuestion.type === "foreign-to-russian"
    ? "Переведите на русский:"
    : isEnglish ? "Переведите на английский:" : "Переведите на испанский:";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md mb-6">
        <div className={`flex items-center justify-between text-sm ${textColor} mb-2`}>
          <span>Тест</span>
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className={`h-2 ${progressBg} rounded-full overflow-hidden`}>
          <motion.div
            className={`h-full bg-gradient-to-r ${progressGradient}`}
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-end mt-2 text-sm">
          <span className="text-green-600">Правильно: {score}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="w-full max-w-md"
        >
            <div className={`bg-gradient-to-br ${cardBg} border-2 ${cardBorder} rounded-3xl p-6 mb-6 shadow-lg`}>
              <p className={`text-sm ${textColor} mb-2`}>
                {translateLabel}
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className={`text-3xl font-bold ${titleColor} text-center`}>
                  {currentQuestion.type === "foreign-to-russian"
                    ? foreignWord
                    : currentQuestion.word.russian}
                </p>
                {currentQuestion.type === "foreign-to-russian" && (
                  <button
                    onClick={() => handleSpeak(foreignWord)}
                    className={`p-2 rounded-full ${isEnglish ? "hover:bg-blue-100" : "hover:bg-amber-100"}`}
                  >
                    <Volume2 className={`w-5 h-5 ${textColor}`} />
                  </button>
                )}
              </div>
              {currentQuestion.type === "foreign-to-russian" && (
                <p className={`text-lg ${textColor} text-center mt-2`}>
                  {currentQuestion.word.transcription}
                </p>
              )}
            </div>

          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === currentQuestion.correctAnswer;
              let buttonClass =
                "w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ";

              if (selectedAnswer === null) {
                buttonClass += `bg-white ${cardHover}`;
              } else if (isSelected && isCorrect) {
                buttonClass += "bg-green-100 border-green-500 text-green-800";
              } else if (isSelected && !isCorrect) {
                buttonClass += "bg-red-100 border-red-500 text-red-800";
              } else if (isCorrectOption) {
                buttonClass += "bg-green-100 border-green-500 text-green-800";
              } else {
                buttonClass += "bg-gray-100 border-gray-200 text-gray-400";
              }

              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={buttonClass}
                  whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                  whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">{option}</span>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        {isCorrect ? (
                          <Check className="w-6 h-6 text-green-600" />
                        ) : (
                          <X className="w-6 h-6 text-red-600" />
                        )}
                      </motion.span>
                    )}
                    {!isSelected && isCorrectOption && selectedAnswer !== null && (
                      <Check className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
