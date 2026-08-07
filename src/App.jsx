import { SettingsProvider } from './context/SettingsContext'
import { LanguageProvider } from './context/LanguageContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AppsSection from './components/AppsSection'
import About from './components/About'
import Blog from './components/Blog'
import EbooksSection from './components/EbooksSection'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'
import SettingsPanel from './components/SettingsPanel'
import PasswordRecovery from './components/PasswordRecovery'
import ErrorBoundary from './components/ErrorBoundary'

// Each section is wrapped separately so a failure in one — the admin panel in
// particular, which is the most complex — degrades that section instead of
// blanking the whole page.
const Section = ({ label, children }) => (
  <ErrorBoundary label={label}>{children}</ErrorBoundary>
)

export default function App() {
  return (
    <LanguageProvider>
    <SettingsProvider>
      <div className="min-h-screen bg-background">
        <Section label="navbar"><Navbar /></Section>
        <main className="pt-16">
          <Section label="hero"><Hero /></Section>
          <Section label="produtos"><AppsSection /></Section>
          <Section label="sobre"><About /></Section>
          <Section label="blog"><Blog /></Section>
          <Section label="ebooks"><EbooksSection /></Section>
          <Section label="depoimentos"><Testimonials /></Section>
          <Section label="contacto"><Contact /></Section>
        </main>
        <Section label="rodapé"><Footer /></Section>
        <Section label="painel admin"><SettingsPanel /></Section>
        <Section label="recuperação de senha"><PasswordRecovery /></Section>
      </div>
    </SettingsProvider>
    </LanguageProvider>
  )
}
