import RoleGuard from '../components/RoleGuard';

// Guards every route under /Admin, including any added later.
export default function AdminLayout({ children }) {
  return <RoleGuard allow={['admin']}>{children}</RoleGuard>;
}
