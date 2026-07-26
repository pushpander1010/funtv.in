import { Routes, Route } from 'react-router-dom'
import SidebarNav from './components/SidebarNav'
import Home from './pages/Home'
import WikiPage from './pages/WikiPage'
import About from './pages/About'
import Contact from './pages/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <div className="flex-1 lg:ml-64">
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wiki/:pageId" element={<WikiPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  )
}