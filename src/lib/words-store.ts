import { Word, WordCategory, words as defaultWords } from './words-data';
import { supabase } from './supabase';

const STORAGE_KEY = 'espanol-words-v2';
const PROGRESS_KEY = 'espanol-progress';
const DIFFICULT_WORDS_KEY = 'espanol-difficult';
const SRS_KEY = 'espanol-srs';
const THEME_KEY = 'espanol-theme';
const STREAK_KEY = 'espanol-streak';
const LAST_ACTIVITY_KEY = 'espanol-last-activity';
const LAST_SYNC_TIME_KEY = 'espanol-last-sync-time';

export interface SRSData {
  wordId: string;
  nextReview: number;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface DifficultWord {
  wordId: string;
  errorCount: number;
  lastError: number;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score?: number;
  total?: number;
}

export interface AppProgress {
  [key: string]: LessonProgress;
}

let currentUserId: string | null = null;

export const setCurrentUser = (userId: string | null) => {
  currentUserId = userId;
};

export const getCurrentUser = () => currentUserId;

export const getStoredWords = (): Word[] => {
  return defaultWords;
};

export const saveWords = (words: Word[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
};

export const getWordsByCategory = (category: WordCategory): Word[] => {
  return getStoredWords().filter(word => word.category === category);
};

export const getLessonsForCategory = (category: WordCategory): Word[][] => {
  const categoryWords = getWordsByCategory(category);
  const lessons: Word[][] = [];
  for (let i = 0; i < categoryWords.length; i += 10) {
    lessons.push(categoryWords.slice(i, i + 10));
  }
  return lessons;
};

export const getLessonWords = (category: WordCategory, lessonIndex: number): Word[] => {
  const lessons = getLessonsForCategory(category);
  return lessons[lessonIndex] || [];
};

export const getLessonCount = (category: WordCategory): number => {
  return getLessonsForCategory(category).length;
};

export const addWords = (newWords: Word[]): void => {
  const existing = getStoredWords();
  const existingIds = new Set(existing.map(w => w.id));
  const uniqueNew = newWords.filter(w => !existingIds.has(w.id));
  saveWords([...existing, ...uniqueNew]);
};

export const importWordsFromExcel = async (
  file: File,
  category: WordCategory
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 });
    
    if (data.length < 2) {
      return { success: false, count: 0, error: 'Файл пустой или содержит только заголовок' };
    }

    const validWords: Word[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as unknown[];
      if (!row || row.length < 2) continue;
      
      const spanish = String(row[0] || '').trim();
      const russian = String(row[1] || '').trim();
      const transcription = row[2] ? String(row[2]).trim() : '';
      
      if (spanish && russian) {
        validWords.push({
          id: `imported_${Date.now()}_${i}`,
          spanish,
          russian,
          transcription,
          category,
        });
      }
    }
    
    if (validWords.length === 0) {
      return { success: false, count: 0, error: 'Не найдено валидных слов' };
    }
    
    addWords(validWords);
    return { success: true, count: validWords.length };
  } catch (e) {
    console.error(e);
    return { success: false, count: 0, error: 'Ошибка чтения Excel файла' };
  }
};

export const exportWordsToExcel = async (category?: WordCategory): Promise<Blob> => {
  const XLSX = await import('xlsx');
  const words = category ? getWordsByCategory(category) : getStoredWords();
  
  const data = [
    ['Испанский', 'Русский', 'Транскрипция', 'Категория'],
    ...words.map(w => [w.spanish, w.russian, w.transcription, w.category])
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Слова');
  
  worksheet['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const clearCategory = (category: WordCategory): void => {
  const words = getStoredWords();
  const filtered = words.filter(w => w.category !== category);
  saveWords(filtered);
};

export const parseManualWords = (
  text: string,
  category: WordCategory
): { success: boolean; words: Word[]; error?: string } => {
  const lines = text.trim().split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return { success: false, words: [], error: 'Текст пустой' };
  }

  const validWords: Word[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const parts = line.split(/\s*[-–—]\s*/);
    
    if (parts.length < 2) continue;
    
    const spanish = parts[0].trim();
    const russian = parts[1].trim();
    const transcription = parts[2]?.trim() || '';
    
    if (spanish && russian) {
      validWords.push({
        id: `manual_${Date.now()}_${i}`,
        spanish,
        russian,
        transcription,
        category,
      });
    }
  }
  
  if (validWords.length === 0) {
    return { success: false, words: [], error: 'Не найдено валидных слов. Формат: слово - перевод' };
  }
  
  return { success: true, words: validWords };
};

export const addManualWords = (words: Word[]): void => {
  addWords(words);
};

export const getProgress = (): AppProgress => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(PROGRESS_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
};

export const getProgressFromCloud = async (): Promise<AppProgress> => {
  if (!currentUserId) return getProgress();
  
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', currentUserId);
    
    if (error) throw error;
    
    const progress: AppProgress = {};
    data?.forEach(row => {
      progress[row.lesson_id] = {
        lessonId: row.lesson_id,
        completed: row.completed,
        score: row.score,
        total: row.total
      };
    });
    
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return progress;
  } catch (e) {
    console.error('Error fetching progress from cloud:', e);
    return getProgress();
  }
};

export const saveLessonProgress = async (category: WordCategory, lessonIndex: number, score: number, total: number): Promise<void> => {
  const progress = getProgress();
  const lessonId = `${category}-${lessonIndex}`;
  progress[lessonId] = { lessonId, completed: true, score, total };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  
  await updateStreak();
  
  if (currentUserId) {
    try {
      await supabase.from('user_progress').upsert({
        user_id: currentUserId,
        lesson_id: lessonId,
        completed: true,
        score,
        total,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });
    } catch (e) {
      console.error('Error saving progress to cloud:', e);
    }
  }
};

export const getLessonProgress = (category: WordCategory, lessonIndex: number): LessonProgress | null => {
  const progress = getProgress();
  return progress[`${category}-${lessonIndex}`] || null;
};

export const resetProgress = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROGRESS_KEY);
  
  if (currentUserId) {
    try {
      await supabase.from('user_progress').delete().eq('user_id', currentUserId);
    } catch (e) {
      console.error('Error resetting progress in cloud:', e);
    }
  }
};

export const getDifficultWords = (): DifficultWord[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DIFFICULT_WORDS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const getDifficultWordsFromCloud = async (): Promise<DifficultWord[]> => {
  if (!currentUserId) return getDifficultWords();
  
  try {
    const { data, error } = await supabase
      .from('user_difficult_words')
      .select('*')
      .eq('user_id', currentUserId);
    
    if (error) throw error;
    
    const difficult: DifficultWord[] = data?.map(row => ({
      wordId: row.word_id,
      errorCount: row.error_count,
      lastError: row.last_error
    })) || [];
    
    localStorage.setItem(DIFFICULT_WORDS_KEY, JSON.stringify(difficult));
    return difficult;
  } catch (e) {
    console.error('Error fetching difficult words from cloud:', e);
    return getDifficultWords();
  }
};

export const markWordAsDifficult = async (wordId: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  const difficult = getDifficultWords();
  const existing = difficult.find(d => d.wordId === wordId);
  const now = Date.now();
  
  if (existing) {
    existing.errorCount++;
    existing.lastError = now;
  } else {
    difficult.push({ wordId, errorCount: 1, lastError: now });
  }
  localStorage.setItem(DIFFICULT_WORDS_KEY, JSON.stringify(difficult));
  
  if (currentUserId) {
    try {
      const errorCount = existing ? existing.errorCount : 1;
      await supabase.from('user_difficult_words').upsert({
        user_id: currentUserId,
        word_id: wordId,
        error_count: errorCount,
        last_error: now
      }, { onConflict: 'user_id,word_id' });
    } catch (e) {
      console.error('Error saving difficult word to cloud:', e);
    }
  }
};

export const removeDifficultWord = async (wordId: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  const difficult = getDifficultWords().filter(d => d.wordId !== wordId);
  localStorage.setItem(DIFFICULT_WORDS_KEY, JSON.stringify(difficult));
  
  if (currentUserId) {
    try {
      await supabase.from('user_difficult_words')
        .delete()
        .eq('user_id', currentUserId)
        .eq('word_id', wordId);
    } catch (e) {
      console.error('Error removing difficult word from cloud:', e);
    }
  }
};

export const getDifficultWordsWithData = (): (Word & { errorCount: number })[] => {
  const difficult = getDifficultWords();
  const allWords = getStoredWords();
  return difficult
    .map(d => {
      const word = allWords.find(w => w.id === d.wordId);
      return word ? { ...word, errorCount: d.errorCount } : null;
    })
    .filter((w): w is Word & { errorCount: number } => w !== null)
    .sort((a, b) => b.errorCount - a.errorCount);
};

export const clearDifficultWords = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DIFFICULT_WORDS_KEY);
  
  if (currentUserId) {
    try {
      await supabase.from('user_difficult_words').delete().eq('user_id', currentUserId);
    } catch (e) {
      console.error('Error clearing difficult words in cloud:', e);
    }
  }
};

export const getSRSData = (): SRSData[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(SRS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const getSRSDataFromCloud = async (): Promise<SRSData[]> => {
  if (!currentUserId) return getSRSData();
  
  try {
    const { data, error } = await supabase
      .from('user_srs')
      .select('*')
      .eq('user_id', currentUserId);
    
    if (error) throw error;
    
    const srsData: SRSData[] = data?.map(row => ({
      wordId: row.word_id,
      nextReview: row.next_review,
      interval: row.interval,
      easeFactor: parseFloat(row.ease_factor),
      repetitions: row.repetitions
    })) || [];
    
    localStorage.setItem(SRS_KEY, JSON.stringify(srsData));
    return srsData;
  } catch (e) {
    console.error('Error fetching SRS data from cloud:', e);
    return getSRSData();
  }
};

export const saveSRSData = (data: SRSData[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SRS_KEY, JSON.stringify(data));
};

export const initializeSRS = (wordId: string): SRSData => ({
  wordId,
  nextReview: Date.now(),
  interval: 1,
  easeFactor: 2.5,
  repetitions: 0,
});

export const updateSRS = async (wordId: string, quality: number): Promise<void> => {
  const srsData = getSRSData();
  let wordSRS = srsData.find(s => s.wordId === wordId);
  
  if (!wordSRS) {
    wordSRS = initializeSRS(wordId);
    srsData.push(wordSRS);
  }

  if (quality < 3) {
    wordSRS.repetitions = 0;
    wordSRS.interval = 1;
  } else {
    if (wordSRS.repetitions === 0) {
      wordSRS.interval = 1;
    } else if (wordSRS.repetitions === 1) {
      wordSRS.interval = 6;
    } else {
      wordSRS.interval = Math.round(wordSRS.interval * wordSRS.easeFactor);
    }
    wordSRS.repetitions++;
  }

  wordSRS.easeFactor = Math.max(1.3, wordSRS.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  wordSRS.nextReview = Date.now() + wordSRS.interval * 24 * 60 * 60 * 1000;

  saveSRSData(srsData);
  
  if (currentUserId) {
    try {
      await supabase.from('user_srs').upsert({
        user_id: currentUserId,
        word_id: wordId,
        next_review: wordSRS.nextReview,
        interval: wordSRS.interval,
        ease_factor: wordSRS.easeFactor,
        repetitions: wordSRS.repetitions,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,word_id' });
    } catch (e) {
      console.error('Error saving SRS data to cloud:', e);
    }
  }
};

export const getWordsForReview = (): Word[] => {
  const srsData = getSRSData();
  const now = Date.now();
  const allWords = getStoredWords();
  
  const dueWordIds = srsData
    .filter(s => s.nextReview <= now)
    .map(s => s.wordId);
  
  return allWords.filter(w => dueWordIds.includes(w.id));
};

export const getReviewCount = (): number => {
  const srsData = getSRSData();
  const now = Date.now();
  return srsData.filter(s => s.nextReview <= now).length;
};

export type Theme = 'light' | 'dark';

export const getTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem(THEME_KEY) as Theme) || 'light';
};

export const setTheme = async (theme: Theme): Promise<void> => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
  
  if (currentUserId) {
    try {
      await supabase.from('user_settings').upsert({
        user_id: currentUserId,
        theme,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.error('Error saving theme to cloud:', e);
    }
  }
};

export const getThemeFromCloud = async (): Promise<Theme> => {
  if (!currentUserId) return getTheme();
  
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('theme, streak, last_activity_date, last_sync_time')
      .eq('user_id', currentUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      if (data.theme) {
        localStorage.setItem(THEME_KEY, data.theme);
        document.documentElement.classList.toggle('dark', data.theme === 'dark');
      }
      if (data.streak !== undefined) {
        localStorage.setItem(STREAK_KEY, data.streak.toString());
      }
      if (data.last_activity_date) {
        localStorage.setItem(LAST_ACTIVITY_KEY, data.last_activity_date);
      }
      if (data.last_sync_time) {
        localStorage.setItem(LAST_SYNC_TIME_KEY, data.last_sync_time);
      }
      return (data.theme as Theme) || getTheme();
    }
    return getTheme();
  } catch (e) {
    console.error('Error fetching settings from cloud:', e);
    return getTheme();
  }
};

export const getStreak = (): number => {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STREAK_KEY) || '0');
};

export const getLastSyncTime = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LAST_SYNC_TIME_KEY) || '';
};

export const updateStreak = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  let streak = getStreak();

  if (lastActivity === today) return;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastActivity === yesterdayStr) {
    streak++;
  } else {
    streak = 1;
  }

  localStorage.setItem(STREAK_KEY, streak.toString());
  localStorage.setItem(LAST_ACTIVITY_KEY, today);
  
  if (currentUserId) {
    try {
      await supabase.from('user_settings').upsert({
        user_id: currentUserId,
        streak,
        last_activity_date: today,
        last_sync_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      localStorage.setItem(LAST_SYNC_TIME_KEY, new Date().toISOString());
    } catch (e) {
      console.error('Error updating streak in cloud:', e);
    }
  }
};

export const initTheme = (): void => {
  if (typeof window === 'undefined') return;
  const theme = getTheme();
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

export const syncAllDataFromCloud = async (): Promise<void> => {
  if (!currentUserId) return;
  
  await Promise.all([
    getProgressFromCloud(),
    getDifficultWordsFromCloud(),
    getSRSDataFromCloud(),
    getThemeFromCloud()
  ]);
};

export const speakSpanish = (text: string): void => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 0.9;
  
  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = voices.find(v => v.lang.startsWith('es'));
  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }
  
  window.speechSynthesis.speak(utterance);
};
