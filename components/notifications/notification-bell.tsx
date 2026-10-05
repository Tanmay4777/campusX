'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  subscribeToNotifications,
  timeAgo,
} from '@/lib/notifications/notifications-service';
import type { Notification } from '@/lib/database.types';
import { cn } from '@/lib/utils';

const typeConfig: Record<string, { color: string; dot: string }> = {
  info: { color: 'text-primary', dot: 'bg-primary' },
  achievement: { color: 'text-accent', dot: 'bg-accent' },
  job: { color: 'text-success', dot: 'bg-success' },
  announcement: { color: 'text-warning', dot: 'bg-warning' },
  interview: { color: 'text-primary', dot: 'bg-primary' },
  error: { color: 'text-destructive', dot: 'bg-destructive' },
};

export function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const [notifs, count] = await Promise.all([
      fetchNotifications(user.id, 15),
      fetchUnreadCount(user.id),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadNotifications();

    if (user) {
      const unsub = subscribeToNotifications(user.id, (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev].slice(0, 15));
        setUnreadCount((prev) => prev + 1);
        toast({ title: newNotif.title, description: newNotif.message });
      });
      unsubRef.current = unsub;
      return () => { unsub(); };
    }
  }, [loadNotifications, user, toast]);

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    const { error } = await markNotificationRead(id, user.id);
    if (error) return;
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    const { error } = await markAllNotificationsRead(user.id);
    if (error) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const { error } = await deleteNotification(id, user.id);
    if (error) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[320px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Bell className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const config = typeConfig[n.type] ?? typeConfig.info;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'group flex items-start gap-2 p-3 transition-colors hover:bg-secondary/50',
                      !n.is_read && 'bg-primary/5'
                    )}
                  >
                    <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.is_read ? 'bg-transparent' : config.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{n.title}</p>
                      {n.message && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>}
                      <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      {!n.is_read && (
                        <button
                          className="rounded p-1 hover:bg-secondary"
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                        >
                          <Check className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        className="rounded p-1 hover:bg-secondary"
                        onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
              <Link href="/dashboard/notifications">View all</Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
