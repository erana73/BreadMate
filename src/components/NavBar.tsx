import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/new-bake', label: 'New Bake' },
  { to: '/my-recipes', label: 'My Recipes' },
  { to: '/starter-log', label: 'Starter Log' },
  { to: '/active-bake', label: 'Active Bake' },
]

export default function NavBar() {
  return (
    <nav className="bg-amber-700 text-white shadow-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
        <span className="text-xl font-bold tracking-wide">BreadMate</span>
        <ul className="flex gap-4 text-sm font-medium">
          {links.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  isActive ? 'underline underline-offset-4' : 'hover:underline hover:underline-offset-4'
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
