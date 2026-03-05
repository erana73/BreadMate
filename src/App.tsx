import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import NewBake from './pages/NewBake'
import MyRecipes from './pages/MyRecipes'
import StarterLog from './pages/StarterLog'
import ActiveBake from './pages/ActiveBake'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-amber-50">
        <NavBar />
        <main className="max-w-4xl mx-auto py-6 px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new-bake" element={<NewBake />} />
            <Route path="/my-recipes" element={<MyRecipes />} />
            <Route path="/starter-log" element={<StarterLog />} />
            <Route path="/active-bake" element={<ActiveBake />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
