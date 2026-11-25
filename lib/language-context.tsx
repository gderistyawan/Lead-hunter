"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { translations } from "@/lib/i18n";

export type Language = "en" | "id";
const STORAGE_KEY = "lead-hunter:language";
// Keep source strings across language changes so an Indonesian view can always
// be translated back to its original English text.
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const attributes = ["aria-label", "aria-description", "placeholder", "title", "data-tooltip"];

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof translations.en) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function translateDom(root: ParentNode, language: Language) {
  const dictionary = translations[language] as Record<string, string>;

  const translateText = (node: Text) => {
    const source = originalText.get(node) ?? node.nodeValue ?? "";
    if (!originalText.has(node)) originalText.set(node, source);
    // Customer-managed data (lead names, contacts, locations and industry
    // values) is content, not UI copy, so never run it through the dictionary.
    if (node.parentElement?.closest("td, .industry-row, [data-no-translate]")) return;
    let result = source;
    for (const [english, translated] of Object.entries(dictionary)) {
      if (english && result.includes(english)) result = result.split(english).join(translated);
    }
    if (node.nodeValue !== result) node.nodeValue = result;
  };

  const translateElement = (element: Element) => {
    if (element.closest("[data-no-translate]") || element.matches("input, textarea, select")) return;
    const saved = originalAttributes.get(element) ?? new Map<string, string>();
    for (const attribute of attributes) {
      const current = element.getAttribute(attribute);
      if (current === null) continue;
      const source = saved.get(attribute) ?? current;
      if (!saved.has(attribute)) saved.set(attribute, source);
      let result = source;
      for (const [english, translated] of Object.entries(dictionary)) {
        if (english && result.includes(english)) result = result.split(english).join(translated);
      }
      if (current !== result) element.setAttribute(attribute, result);
    }
    originalAttributes.set(element, saved);
  };

  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
    else if (node instanceof Element) {
      translateElement(node);
      node.childNodes.forEach(visit);
    }
  };
  if (root instanceof Element) visit(root);
  else root.childNodes.forEach(visit);

  return { visit };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "id") updateLanguage(saved);
    } catch {
      // Continue with the English default when browser storage is unavailable.
    }
    setReady(true);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    updateLanguage(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The active language still changes for this session if storage is unavailable.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key) => translations[language][key]
  }), [language, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
    const translated = translateDom(document.body, language);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData" && record.target instanceof Text) translated.visit(record.target);
        record.addedNodes.forEach(translated.visit);
        if (record.type === "attributes" && record.target instanceof Element) translated.visit(record.target);
      }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["aria-label", "aria-description", "placeholder", "title", "data-tooltip"] });
    return () => observer.disconnect();
  }, [language, ready]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
