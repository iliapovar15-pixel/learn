"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { WordCategory, getCategoryName, getCategoryEmoji } from "../lib/words-data";
import { getLessonCount, getWordsByCategory, getReviewCount, getDifficultWordsWithData, initTheme, getTheme, setTheme, Theme, syncAllDataFromCloud, getStreak, getLastSyncTime, getProgress } from "../lib/words-store";
import * as storeEn from "../lib/words-store-en";
import { BookOpen, Sparkles, Settings, Brain, AlertTriangle, PenTool, Moon, Sun, User, LogOut, Globe, Flame, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../components/AuthProvider";
import { Progress } from "../components/ui/progress";

const categories: WordCategory[] = ["verbs", "adjectives", "nouns"];

type Language = "es" | "en";
const LANGUAGE_KEY = "learning-language";

export default function Home() {
  const [language, setLanguageState] = useState<Language>("es");
  const [counts, setCounts] = useState<Record<WordCategory, { words: number; lessons: number; completed: number }>>({
    verbs: { words: 0, lessons: 0, completed: 0 },
    adjectives: { words: 0, lessons: 0, completed: 0 },
    nouns: { words: 0, lessons: 0, completed: 0 },
  });
  const [reviewCount, setReviewCount] = useState(0);
  const [difficultCount, setDifficultCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastSync, setLastSync] = useState("");
  const [theme, setThemeState] = useState<Theme>("light");
  const { user, signOut, loading } = useAuth();

  const loadData = (lang: Language) => {
    if (lang === "es") {
      const progress = getProgress();
      const getCompletedCount = (cat: WordCategory) => {
        return Object.keys(progress).filter(id => id.startsWith(cat) && progress[id].completed).length;
      };
      
      setCounts({
        verbs: { words: getWordsByCategory("verbs").length, lessons: getLessonCount("verbs"), completed: getCompletedCount("verbs") },
        adjectives: { words: getWordsByCategory("adjectives").length, lessons: getLessonCount("adjectives"), completed: getCompletedCount("adjectives") },
        nouns: { words: getWordsByCategory("nouns").length, lessons: getLessonCount("nouns"), completed: getCompletedCount("nouns") },
      });
      setReviewCount(getReviewCount());
      setDifficultCount(getDifficultWordsWithData().length);
      setStreak(getStreak());
      setLastSync(getLastSyncTime());
    } else {
      const progress = storeEn.getProgress();
      const getCompletedCount = (cat: WordCategory) => {
        return Object.keys(progress).filter(id => id.startsWith(cat) && progress[id].completed).length;
      };
      
      setCounts({
        verbs: { words: storeEn.getWordsByCategory("verbs").length, lessons: storeEn.getLessonCount("verbs"), completed: getCompletedCount("verbs") },
        adjectives: { words: storeEn.getWordsByCategory("adjectives").length, lessons: storeEn.getLessonCount("adjectives"), completed: getCompletedCount("adjectives") },
        nouns: { words: storeEn.getWordsByCategory("nouns").length, lessons: storeEn.getLessonCount("nouns"), completed: getCompletedCount("nouns") },
      });
      setReviewCount(storeEn.getReviewCount());
      setDifficultCount(storeEn.getDifficultWordsWithData().length);
      setStreak(storeEn.getStreak());
      setLastSync(storeEn.getLastSyncTime());
    }
  };

  useEffect(() => {
    initTheme();
    setThemeState(getTheme());
    const savedLang = localStorage.getItem(LANGUAGE_KEY) as Language || "es";
    setLanguageState(savedLang);
    loadData(savedLang);
  }, []);

  useEffect(() => {
    if (user) {
      if (language === "es") {
        syncAllDataFromCloud().then(() => loadData("es"));
      } else {
        storeEn.syncAllDataFromCloud().then(() => loadData("en"));
      }
    }
  }, [user, language]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    setThemeState(newTheme);
  };

  const toggleLanguage = () => {
    const newLang: Language = language === "es" ? "en" : "es";
    setLanguageState(newLang);
    localStorage.setItem(LANGUAGE_KEY, newLang);
    loadData(newLang);
  };

  const langConfig = {
    es: {
      title: "Español",
      subtitle: "Учите испанский с карточками",
      flag: "🇪🇸",
      gradient: "from-amber-400 to-orange-500",
      bgGradient: "from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
      accent: "amber",
      blob1: "bg-amber-200/30 dark:bg-amber-900/20",
      blob2: "bg-orange-200/30 dark:bg-orange-900/20",
      blob3: "bg-yellow-200/30 dark:bg-yellow-900/20",
    },
    en: {
      title: "English",
      subtitle: "Учите английский с карточками",
      flag: "🇬🇧",
      gradient: "from-blue-400 to-indigo-500",
      bgGradient: "from-blue-50 via-indigo-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
      accent: "blue",
      blob1: "bg-blue-200/30 dark:bg-blue-900/20",
      blob2: "bg-indigo-200/30 dark:bg-indigo-900/20",
      blob3: "bg-cyan-200/30 dark:bg-cyan-900/20",
    },
  };

  const config = langConfig[language];
  const accentClasses = language === "es" 
    ? {
        text: "text-amber-700 dark:text-amber-400",
        hover: "hover:bg-amber-100 dark:hover:bg-gray-700",
        title: "text-amber-900 dark:text-white",
        subtitle: "text-amber-700 dark:text-amber-400",
        card: "border-amber-100 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600",
        categoryBg: "from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50",
        categoryText: "text-amber-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400",
        categorySubtext: "text-amber-600 dark:text-amber-400",
        arrow: "from-amber-400 to-orange-400",
        sparkle: "text-amber-500",
        footer: "text-amber-500 dark:text-amber-600",
      }
    : {
        text: "text-blue-700 dark:text-blue-400",
        hover: "hover:bg-blue-100 dark:hover:bg-gray-700",
        title: "text-blue-900 dark:text-white",
        subtitle: "text-blue-700 dark:text-blue-400",
        card: "border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600",
        categoryBg: "from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50",
        categoryText: "text-blue-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
        categorySubtext: "text-blue-600 dark:text-blue-400",
        arrow: "from-blue-400 to-indigo-400",
        sparkle: "text-blue-500",
        footer: "text-blue-500 dark:text-blue-600",
      };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} transition-colors`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 ${config.blob1} rounded-full blur-3xl`} />
        <div className={`absolute top-40 right-20 w-96 h-96 ${config.blob2} rounded-full blur-3xl`} />
        <div className={`absolute bottom-20 left-1/3 w-80 h-80 ${config.blob3} rounded-full blur-3xl`} />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-8">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 ${streak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 opacity-50'} font-bold transition-all`}>
              <Flame className={`w-5 h-5 ${streak > 0 ? 'fill-orange-500' : ''}`} />
              <span>{streak}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`${accentClasses.text} ${accentClasses.hover}`}
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className={`${accentClasses.text} ${accentClasses.hover} text-xl`}
              title={language === "es" ? "Switch to English" : "Переключить на испанский"}
            >
              {config.flag}
            </Button>
          </div>
          <div className="flex gap-2">
            {!loading && (
              user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  className={`${accentClasses.text} ${accentClasses.hover}`}
                  title="Выйти"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              ) : (
                <Link href="/auth">
                  <Button variant="ghost" size="icon" className={`${accentClasses.text} ${accentClasses.hover}`}>
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              )
            )}
            <Link href="/settings">
              <Button variant="ghost" size="icon" className={`${accentClasses.text} ${accentClasses.hover}`}>
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${config.gradient} rounded-3xl shadow-lg mb-6`}>
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-4xl font-black ${accentClasses.title} mb-3 tracking-tight`}>
            {config.title}
          </h1>
          <p className={`text-lg ${accentClasses.subtitle}`}>
            {config.subtitle}
          </p>
          {user && (
            <div className="mt-2 text-center">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Синхронизация включена
              </p>
              {lastSync && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  Последнее обновление: {new Date(lastSync).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          )}
        </motion.header>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="grid grid-cols-3 gap-3">
            <Link href={`/review?lang=${language}`}>
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white text-center hover:scale-105 transition-transform">
                <Brain className="w-6 h-6 mx-auto mb-1" />
                <p className="text-xs font-medium opacity-90">Повторение</p>
                {reviewCount > 0 && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {reviewCount}
                  </span>
                )}
              </div>
            </Link>
            <Link href={`/difficult?lang=${language}`}>
              <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 text-white text-center hover:scale-105 transition-transform">
                <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
                <p className="text-xs font-medium opacity-90">Сложные</p>
                {difficultCount > 0 && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {difficultCount}
                  </span>
                )}
              </div>
            </Link>
            <Link href={`/writing?lang=${language}`}>
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-4 text-white text-center hover:scale-105 transition-transform">
                <PenTool className="w-6 h-6 mx-auto mb-1" />
                <p className="text-xs font-medium opacity-90">Письмо</p>
              </div>
            </Link>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className={`w-5 h-5 ${accentClasses.sparkle}`} />
            <h2 className={`text-lg font-bold ${accentClasses.title}`}>Категории</h2>
          </div>

          <div className="space-y-3">
            {categories.map((category, index) => {
              const { words: wordsCount, lessons: lessonsCount } = counts[category];
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Link href={`/category?category=${category}&lang=${language}`}>
                    <div className={`group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 ${accentClasses.card} rounded-2xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accentClasses.categoryBg} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                          {getCategoryEmoji(category)}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold ${accentClasses.categoryText} transition-colors`}>
                            {getCategoryName(category)}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress 
                              value={(counts[category].completed / counts[category].lessons) * 100} 
                              className="h-1.5 flex-1"
                            />
                            <p className={`${accentClasses.categorySubtext} text-[10px] whitespace-nowrap`}>
                              {counts[category].completed}/{counts[category].lessons}
                            </p>
                          </div>
                          <p className={`${accentClasses.categorySubtext} text-[10px] mt-1 opacity-70`}>
                            {wordsCount} слов
                          </p>
                        </div>
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${accentClasses.arrow} flex items-center justify-center text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity`}>
                          →
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`text-center mt-8 text-sm ${accentClasses.footer}`}
        >
          <p>Изучайте по 10 слов за урок</p>
        </motion.footer>
      </div>
    </div>
  );
}
