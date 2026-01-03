"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Upload, Download, Trash2, Check, AlertCircle, FileSpreadsheet, Layers, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { WordCategory, getCategoryName, getCategoryEmoji } from "../../lib/words-data";
import {
  getWordsByCategory,
  importWordsFromExcel,
  exportWordsToExcel,
  clearCategory,
  resetProgress,
  getStoredWords,
  parseManualWords,
  addManualWords,
} from "../../lib/words-store";
import * as storeEn from "../../lib/words-store-en";

const categories: WordCategory[] = ["verbs", "adjectives", "nouns"];
type Language = "es" | "en";
type ImportTab = "blocks" | "import";

export default function SettingsPage() {
  const [language, setLanguage] = useState<Language>("es");
  const [counts, setCounts] = useState<Record<WordCategory, number>>({
    verbs: 0,
    adjectives: 0,
    nouns: 0,
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | "all">("all");
  const [importCategory, setImportCategory] = useState<WordCategory>("verbs");
  const [importTab, setImportTab] = useState<ImportTab>("import");
  const [manualText, setManualText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("learning-language") as Language || "es";
    setLanguage(savedLang);
    updateCounts(savedLang);
  }, []);

  const updateCounts = (lang: Language) => {
    if (lang === "es") {
      setCounts({
        verbs: getWordsByCategory("verbs").length,
        adjectives: getWordsByCategory("adjectives").length,
        nouns: getWordsByCategory("nouns").length,
      });
    } else {
      setCounts({
        verbs: storeEn.getWordsByCategory("verbs").length,
        adjectives: storeEn.getWordsByCategory("adjectives").length,
        nouns: storeEn.getWordsByCategory("nouns").length,
      });
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("learning-language", lang);
    updateCounts(lang);
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = language === "es" 
      ? await importWordsFromExcel(file, importCategory)
      : await storeEn.importWordsFromExcel(file, importCategory);
      
    if (result.success) {
      showMessage("success", `Импортировано ${result.count} слов в категорию "${getCategoryName(importCategory)}"`);
      updateCounts(language);
    } else {
      showMessage("error", result.error || "Ошибка импорта");
    }
    event.target.value = "";
  };

  const handleManualSave = () => {
    if (!manualText.trim()) {
      showMessage("error", "Введите слова для импорта");
      return;
    }

    const result = language === "es"
      ? parseManualWords(manualText, importCategory)
      : storeEn.parseManualWords(manualText, importCategory);

    if (result.success) {
      if (language === "es") {
        addManualWords(result.words);
      } else {
        storeEn.addManualWords(result.words);
      }
      showMessage("success", `Добавлено ${result.words.length} слов в категорию "${getCategoryName(importCategory)}"`);
      setManualText("");
      updateCounts(language);
    } else {
      showMessage("error", result.error || "Ошибка парсинга");
    }
  };

  const handleExport = async () => {
    const blob = language === "es"
      ? await exportWordsToExcel(selectedCategory === "all" ? undefined : selectedCategory)
      : await storeEn.exportWordsToExcel(selectedCategory === "all" ? undefined : selectedCategory);
    const langLabel = language === "es" ? "espanol" : "english";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${langLabel}-words-${selectedCategory}-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage("success", "Файл экспортирован");
  };

  const handleClearCategory = (category: WordCategory) => {
    if (language === "es") {
      clearCategory(category);
    } else {
      storeEn.clearCategory(category);
    }
    updateCounts(language);
    showMessage("success", `Категория "${getCategoryName(category)}" очищена`);
  };

  const handleResetProgress = async () => {
    if (language === "es") {
      await resetProgress();
    } else {
      await storeEn.resetProgress();
    }
    showMessage("success", "Прогресс сброшен");
  };

  const totalWords = language === "es" ? getStoredWords().length : storeEn.getStoredWords().length;
  const isEnglish = language === "en";
  
  const bgGradient = isEnglish 
    ? "from-blue-50 via-indigo-50 to-cyan-50" 
    : "from-amber-50 via-orange-50 to-yellow-50";
  const blob1 = isEnglish ? "bg-blue-200/30" : "bg-amber-200/30";
  const blob2 = isEnglish ? "bg-indigo-200/30" : "bg-orange-200/30";
  const textColor = isEnglish ? "text-blue-700" : "text-amber-700";
  const hoverBg = isEnglish ? "hover:bg-blue-100" : "hover:bg-amber-100";
  const titleColor = isEnglish ? "text-blue-900" : "text-amber-900";
  const subtextColor = isEnglish ? "text-blue-600" : "text-amber-600";
  const borderColor = isEnglish ? "border-blue-100" : "border-amber-100";
  const cardBg = isEnglish ? "bg-blue-50" : "bg-amber-50";
  const buttonActive = isEnglish ? "bg-blue-500" : "bg-amber-500";
  const buttonInactive = isEnglish ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200";
  const buttonGradient = isEnglish 
    ? "from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600" 
    : "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600";
  const buttonOutline = isEnglish ? "border-blue-300 text-blue-700 hover:bg-blue-50" : "border-amber-300 text-amber-700 hover:bg-amber-50";

  const langLabel = isEnglish ? "Английский" : "Испанский";
  const wordColumn = isEnglish ? "A: Английский" : "A: Испанский";
  const exampleWord = isEnglish ? "speak" : "hablar";
  const exampleManual = isEnglish ? "speak - говорить\nlisten - слушать\nread - читать" : "comer - есть\nvivir - жить\nhablar - говорить";

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 ${blob1} rounded-full blur-3xl`} />
        <div className={`absolute bottom-20 right-20 w-96 h-96 ${blob2} rounded-full blur-3xl`} />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-6">
        <header className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className={`${textColor} ${hoverBg}`}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className={`text-2xl font-bold ${titleColor}`}>Настройки</h1>
        </header>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </motion.div>
        )}

        <section className="mb-8">
          <h2 className={`text-lg font-bold ${titleColor} mb-4`}>Выбор языка</h2>
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border-2 ${borderColor} p-4`}>
            <div className="flex gap-3">
              <button
                onClick={() => handleLanguageChange("es")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  language === "es"
                    ? "bg-amber-500 text-white"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                }`}
              >
                🇪🇸 Испанский
              </button>
              <button
                onClick={() => handleLanguageChange("en")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  language === "en"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                🇬🇧 Английский
              </button>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className={`text-lg font-bold ${titleColor} mb-4`}>Статистика слов ({langLabel})</h2>
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border-2 ${borderColor} p-4`}>
            <div className="text-center mb-4">
              <span className={`text-3xl font-bold ${titleColor}`}>{totalWords}</span>
              <span className={`${subtextColor} ml-2`}>слов всего</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className={`text-center p-3 ${cardBg} rounded-xl`}
                >
                  <span className="text-2xl">{getCategoryEmoji(cat)}</span>
                  <p className={`text-xl font-bold ${titleColor}`}>{counts[cat]}</p>
                  <p className={`text-xs ${subtextColor}`}>{getCategoryName(cat)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className={`text-lg font-bold ${titleColor} mb-4`}>Добавить слова ({langLabel})</h2>
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border-2 ${borderColor} p-4`}>
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setImportTab("blocks")}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-all border-b-2 ${
                  importTab === "blocks"
                    ? `${textColor} border-current`
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                <Layers className="w-5 h-5" />
                БЛОКИ
              </button>
              <button
                onClick={() => setImportTab("import")}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-all border-b-2 ${
                  importTab === "import"
                    ? `${textColor} border-current`
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                <Plus className="w-5 h-5" />
                ИМПОРТ
              </button>
            </div>

            <p className={`text-sm ${subtextColor} mb-2`}>Выберите категорию:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setImportCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    importCategory === cat
                      ? `${buttonActive} text-white`
                      : buttonInactive
                  }`}
                >
                  {getCategoryEmoji(cat)} {getCategoryName(cat)}
                </button>
              ))}
            </div>

            {importTab === "blocks" && (
              <>
                <p className={`text-xs ${subtextColor} mb-2`}>
                  Формат: слово - перевод (каждое слово с новой строки)
                </p>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={exampleManual}
                  className={`w-full h-32 p-3 rounded-xl border-2 ${borderColor} bg-white/50 focus:outline-none focus:ring-2 ${
                    isEnglish ? "focus:ring-blue-300" : "focus:ring-amber-300"
                  } resize-none text-gray-700 placeholder:text-gray-400`}
                />
                <Button
                  onClick={handleManualSave}
                  className={`w-full mt-4 bg-gradient-to-r ${buttonGradient} text-white`}
                >
                  СОХРАНИТЬ
                </Button>
              </>
            )}

            {importTab === "import" && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <span className={`text-sm ${textColor} font-medium`}>Формат файла .xlsx</span>
                </div>
                <p className={`text-sm ${subtextColor} mb-3`}>
                  Колонки в Excel:
                </p>
                <div className={`${cardBg} p-3 rounded-lg mb-4 overflow-x-auto`}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`border-b ${isEnglish ? "border-blue-200" : "border-amber-200"}`}>
                        <th className={`text-left py-1 px-2 ${textColor}`}>{wordColumn}</th>
                        <th className={`text-left py-1 px-2 ${textColor}`}>B: Русский</th>
                        <th className={`text-left py-1 px-2 ${textColor}`}>C: Транскрипция</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={`py-1 px-2 ${subtextColor}`}>{exampleWord}</td>
                        <td className={`py-1 px-2 ${subtextColor}`}>говорить</td>
                        <td className={`py-1 px-2 ${subtextColor}`}>[аблар]</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full bg-gradient-to-r ${buttonGradient} text-white`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Загрузить Excel файл
                </Button>
              </>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className={`text-lg font-bold ${titleColor} mb-4`}>Экспорт слов в Excel</h2>
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border-2 ${borderColor} p-4`}>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === "all"
                    ? `${buttonActive} text-white`
                    : buttonInactive
                }`}
              >
                Все слова
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? `${buttonActive} text-white`
                      : buttonInactive
                  }`}
                >
                  {getCategoryEmoji(cat)} {getCategoryName(cat)}
                </button>
              ))}
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              className={`w-full ${buttonOutline}`}
            >
              <Download className="w-4 h-4 mr-2" />
              Скачать Excel
            </Button>
          </div>
        </section>

        <section className="mb-8">
          <h2 className={`text-lg font-bold ${titleColor} mb-4`}>Очистить категорию ({langLabel})</h2>
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border-2 ${borderColor} p-4 space-y-3`}>
            {categories.map((cat) => (
              <div key={cat} className="flex items-center justify-between">
                <span className={isEnglish ? "text-blue-800" : "text-amber-800"}>
                  {getCategoryEmoji(cat)} {getCategoryName(cat)} ({counts[cat]})
                </span>
                <Button
                  onClick={() => handleClearCategory(cat)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  disabled={counts[cat] === 0}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={`text-lg font-bold ${titleColor} mb-4`}>Прогресс ({langLabel})</h2>
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border-2 ${borderColor} p-4`}>
            <p className={`text-sm ${subtextColor} mb-4`}>
              Сбросить весь прогресс обучения для {langLabel.toLowerCase()}
            </p>
            <Button
              onClick={handleResetProgress}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Сбросить прогресс
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
