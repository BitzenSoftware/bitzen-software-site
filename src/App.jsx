import { SettingsProvider } from './context/SettingsContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AppsSection from './components/AppsSection'
import About from './components/About'
import Blog from './components/Blog'
import Contact from './components/Contact'
import Footer from './components/Footer'
import SettingsPanel from './components/SettingsPanel'

export default function App() {
  return (
    <SettingsProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <Hero />
          <AppsSection />
          <About />
          <Blog />
          <Contact />
        </main>
        <Footer />
        <SettingsPanel />
      </div>
    </SettingsProvider>
  )
}
