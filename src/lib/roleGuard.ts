
export const setUserRole = (role: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_role', role);
  }
};

export const getUserRole = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user_role');
  }
  return null;
};

export const clearUserRole = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_role');
    localStorage.removeItem('auth_token');
  }
};

export const isSuperAdmin = (): boolean => {
  return getUserRole() === 'super_admin';
};