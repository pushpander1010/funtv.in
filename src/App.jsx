import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import SidebarNav from './components/SidebarNav'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import WikiPage from './pages/WikiPage'
import About from './pages/About'
import Contact from './pages/Contact'
import Footer from './components/Footer'
import MobileStickyAd from './components/MobileStickyAd'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <SidebarNav mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />
      <div className="flex-1 lg:ml-64">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} mobileOpen={sidebarOpen} />
        <main className="py-4 sm:py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wiki/:pageId" element={<WikiPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <MobileStickyAd />
    </div>
  )
}
