// src/lib/api-utils.ts
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function enrichWithProfiles(supabase: any, items: any[], userIdField = 'user_id') {
  if (!items || items.length === 0) return [];

  const userIds = [...new Set(items.map(item => item[userIdField]).filter(Boolean))];
  if (userIds.length === 0) return items.map(item => ({ ...item, user_email: '', user_full_name: '' }));

  // جلب profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  const missingIds = userIds.filter(id => !profileMap.has(id));

  if (missingIds.length > 0) {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authMap = new Map<string, { email: string; full_name: string }>();
    (authUsers?.users || []).forEach((user: any) => {
      authMap.set(user.id, {
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.raw_user_meta_data?.full_name || '',
      });
    });

    return items.map(item => {
      const prof = profileMap.get(item[userIdField]);
      if (prof) {
        return {
          ...item,
          user_email: prof.email || '',
          user_full_name: prof.full_name || '',
        };
      }
      const auth = authMap.get(item[userIdField]);
      return {
        ...item,
        user_email: auth?.email || '',
        user_full_name: auth?.full_name || '',
      };
    });
  } else {
    return items.map(item => {
      const prof = profileMap.get(item[userIdField]);
      return {
        ...item,
        user_email: prof?.email || '',
        user_full_name: prof?.full_name || '',
      };
    });
  }
}