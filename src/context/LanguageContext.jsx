import { createContext, useContext, useState } from 'react'
import { translations } from '../i18n'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('bitzen_lang') || 'pt')

  function changeLang(l) {
    setLang(l)
    localStorage.setItem('bitzen_lang', l)
  }

  function t(key) {
    return translations[lang]?.[key] ?? translations.pt[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
