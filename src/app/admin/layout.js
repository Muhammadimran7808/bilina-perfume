import RoleGuard from '../components/RoleGuard';
import AdminNav from './AdminNav';

// Guards every route under /admin, including any added later.
export default function AdminLayout({ children }) {
  return (
    <RoleGuard allow={['admin']}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <header className="mb-8">
            <p className="text-[#C9A96E] text-[11px] font-semibold tracking-[0.25em] uppercase mb-2">
              Administration
            </p>
            <h1 className="font-playfair text-3xl md:text-4xl font-bold text-[#f5f5f0]">
              Dashboard
            </h1>
            <div className="mt-4 h-px w-12 bg-[#C9A96E]" />
          </header>
          <AdminNav />
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </RoleGuard>
  );
}
