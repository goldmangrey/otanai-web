import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, translations } from './translations.js'
import { I18nContext } from './I18nContext.js'

function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return translations[saved] ? saved : DEFAULT_LANGUAGE
  })

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => {
    const dictionary = translations[language] || translations[DEFAULT_LANGUAGE]
    return {
      language,
      setLanguage,
      t(key, replacements = {}) {
        const template = dictionary[key] || translations[DEFAULT_LANGUAGE][key] || key
        return Object.entries(replacements).reduce(
          (text, [name, replacement]) => text.replaceAll(`{${name}}`, replacement),
          template
        )
      }
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export default I18nProvider
