'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ClipboardList } from 'lucide-react';

const TABS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-[#1e1e1e]">
      {TABS.map(({ href, label, icon: Icon }) => {
        // /admin is only active on an exact match, or it would light up on
        // every child route.
        const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-3 text-[12px] font-semibold tracking-[0.12em] uppercase border-b-2 -mb-px transition-colors ${
              active
                ? 'border-[#C9A96E] text-[#C9A96E]'
                : 'border-transparent text-[#888] hover:text-[#f5f5f0]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
