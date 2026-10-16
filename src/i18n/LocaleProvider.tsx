import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { formatMinor } from '../util/money';
import { Lang, MessageKey, translate } from './messages';

const LANG_KEY = 'faroojalmasi.lang';

export type Direction = 'ltr' | 'rtl';

interface LocaleContextValue {
  lang: Lang;
  dir: Direction;
  isRTL: boolean;
  /** Translate a key, interpolating `{var}` placeholders. */
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  /** A price in the active language's currency wording, e.g. "SAR 32.50" / "32.50 ر.س". */
  sar: (amountMinor: number) => string;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

function valueFor(lang: Lang): Omit<LocaleContextValue, 'setLang' | 'toggle'> {
  const dir: Direction = lang === 'ar' ? 'rtl' : 'ltr';
  return {
    lang,
    dir,
    isRTL: dir === 'rtl',
    t: (key, vars) => translate(lang, key, vars),
    sar: (amountMinor) => translate(lang, 'common.sar', { amount: formatMinor(amountMinor) }),
  };
}

const DEFAULT = valueFor('en');

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Owns the app language and direction.
 *
 * The choice is persisted so it survives a restart. Text switches immediately
 * on toggle (every string reads through `t`, and the shared primitives read
 * `dir` for alignment). Full native layout mirroring of third-party views
 * (maps, the stack animator) is a `forceRTL` concern that React Native applies
 * on the next launch, so the toggle sets that flag too — the text is right now,
 * the last mirrored edges settle on the next open. Writing the flag is wrapped
 * in try/catch because it is a no-op (and sometimes throws) in the test
 * renderer, where it must not take the app down.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync(LANG_KEY)
      .then((stored) => {
        if (mounted && (stored === 'en' || stored === 'ar')) {
          setLangState(stored);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    SecureStore.setItemAsync(LANG_KEY, next).catch(() => undefined);
    try {
      const wantRTL = next === 'ar';
      if (I18nManager.isRTL !== wantRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(wantRTL);
      }
    } catch {
      // Non-fatal — JS `dir` still drives alignment this session.
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ ...valueFor(lang), setLang, toggle: () => setLang(lang === 'ar' ? 'en' : 'ar') }),
    [lang, setLang],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Read the locale. Does **not** throw without a provider — it returns the
 * English/LTR default — so a screen or primitive mounted in isolation (the test
 * renderer) still works, the same discipline as `useRealtime`.
 */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) {
    return ctx;
  }
  return { ...DEFAULT, setLang: () => undefined, toggle: () => undefined };
}
