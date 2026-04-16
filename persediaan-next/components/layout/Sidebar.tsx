import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Home, BarChart2, Settings, LogOut, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Dashboard', icon: Home, path: '/dashboard' },
  { name: 'Data Barang', icon: Package, path: '/barang' },
  { name: 'Permintaan', icon: ClipboardList, path: '/permintaan' },
  { name: 'Laporan', icon: BarChart2, path: '/laporan' },
  { name: 'Pengaturan', icon: Settings, path: '/pengaturan' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col p-4">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Package className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-lg text-white">PERSEDIAAN ATK</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.name}
              href={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <button className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-auto">
        <LogOut className="w-5 h-5" />
        <span>Keluar</span>
      </button>
    </div>
  );
}
