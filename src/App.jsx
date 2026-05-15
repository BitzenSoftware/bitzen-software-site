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

export default function App() {
  return (
    <LanguageProvider>
    <SettingsProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <Hero />
          <AppsSection />
          <About />
          <Blog />
          <EbooksSection />
          <Testimonials />
          <Contact />
        </main>
        <Footer />
        <SettingsPanel />
      </div>
    </SettingsProvider>
    </LanguageProvider>
  )
}
