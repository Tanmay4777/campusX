import { supabase } from '@/lib/supabase/client';
import type { Notification, NotificationPreference } from '@/lib/database.types';

export async function fetchNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data ?? [];
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(id: string, userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', userId);
  return { error: error?.message ?? null };
}

export async function markAllNotificationsRead(userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return { error: error?.message ?? null };
}

export async function deleteNotification(id: string, userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  return { error: error?.message ?? null };
}

export async function createNotification(
  userId: string,
  params: { type: string; title: string; message?: string; link?: string }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: params.type,
    title: params.title,
    message: params.message ?? '',
    link: params.link ?? '',
  });
  return { error: error?.message ?? null };
}

export async function fetchNotificationPreferences(userId: string): Promise<NotificationPreference | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
  return data;
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreference>
): Promise<{ error: string | null }> {
  const { id: _id, user_id: _uid, created_at: _ca, updated_at: _ua, ...safePrefs } = prefs;
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, ...safePrefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  return { error: error?.message ?? null };
}

export function subscribeToNotifications(
  userId: string,
  onNew: (notification: Notification) => void
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNew(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
