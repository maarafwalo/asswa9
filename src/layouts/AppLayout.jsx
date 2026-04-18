import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import { useProductsStore } from '../stores/productsStore.js'
import { useEffect } from 'react'
import { ROLE_LABELS } from '../lib/utils.js'

const NAV = [
  { path: '/pos',      label: 'POS',     icon: '🛒', roles: ['admin','cashier','store_manager'] },
  { path: '/expenses', label: 'مصاريف',  icon: '💸', roles: ['admin','cashier','store_manager'] },
  { path: '/stock',    label: 'مخزن',    icon: '📦', roles: ['admin','stock_manager','assistant','store_manager'] },
  { path: '/editing',  label: 'تعديل',   icon: '✏️', roles: ['admin','stock_manager','assistant','store_manager'] },
  { path: '/reports',  label: 'تقارير',  icon: '📊', roles: ['admin','cashier','store_manager'] },
]

export default function AppLayout() {
  const { profile, signOut }             = useAuthStore()
  const { settings, load: loadSettings } = useSettingsStore()
  const { load: loadProducts, subscribeRealtime } = useProductsStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => { loadSettings(); loadProducts() }, [])
  useEffect(() => { const unsub = subscribeRealtime(); return unsub }, [])

  const allowedNav = NAV.filter(n => n.roles.includes(profile?.role))

  return (
    <div className="flex flex-col h-screen overflow-hidden font-arabic" dir="rtl">
      {/* ── HORIZONTAL HEADER ── */}
      <header className="flex items-center gap-2 px-3 h-[54px] bg-[#1a56db] text-white z-40 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <span className="text-xl">🏪</span>
          <span className="font-black text-base tracking-tight">{settings?.store_name || 'joud-lite'}</span>
        </div>

        <nav className="flex gap-1 flex-1 overflow-x-auto">
          {allowedNav.map(n => (
            <button
              key={n.path}
              onClick={() => navigate(n.path)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                location.pathname === n.path
                  ? 'bg-white text-[#1a56db] shadow'
                  : 'bg-white/15 hover:bg-white/25'
              }`}
            >
              <span>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs opacity-70 hidden sm:block">{ROLE_LABELS[profile?.role]}</span>
          <button onClick={signOut} className="bg-white/15 hover:bg-white/30 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors">
            خروج
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
