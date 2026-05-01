import { jwtDecode } from 'jwt-decode';

export async function getUserRole(): Promise<string> {
  // 1. من localStorage (التوكن)
  const token = localStorage.getItem('auth_token');
  if (!token) return 'customer';

  // 2. محاولة فك التوكن
  try {
    const decoded: any = jwtDecode(token);
    const roleFromToken = decoded.role || decoded.app_metadata?.role || decoded.user_metadata?.role;
    if (roleFromToken) return roleFromToken;
  } catch (e) {}

  // 3. إذا لم نجد الدور في التوكن، نطلبه من API
  try {
    const res = await fetch('/api/user/role', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok && data.role) return data.role;
  } catch (e) {}

  return 'customer';
}