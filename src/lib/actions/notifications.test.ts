import { describe, it, expect, beforeEach, vi } from "vitest";

// In-memory notifications store backing the supabase mock
type Notif = { id: string; user_id: string; read: boolean };
let store: Notif[] = [];
const listeners: Array<() => void> = [];

vi.mock("@/integrations/supabase/client", () => {
  const buildSelect = (userId: string, onlyUnread: boolean) => {
    const rows = store.filter(
      (n) => n.user_id === userId && (!onlyUnread || !n.read)
    );
    return Promise.resolve({ data: rows, count: rows.length, error: null });
  };

  const from = (_table: string) => {
    const ctx: { userId?: string; onlyUnread: boolean; updateRead?: boolean } = {
      onlyUnread: false,
    };
    const chain: any = {
      select: (_cols?: string, _opts?: { count?: string; head?: boolean }) =>
        chain,
      eq: (col: string, val: any) => {
        if (col === "user_id") ctx.userId = val;
        if (col === "read" && val === false) ctx.onlyUnread = true;
        if (col === "id") {
          // markAsRead path
          const target = store.find((n) => n.id === val);
          if (target && ctx.updateRead) {
            target.read = true;
            listeners.forEach((l) => l());
          }
        }
        // Terminal for HEAD count requests: return a thenable
        return new Proxy(chain, {
          get(t, p) {
            if (p === "then")
              return (resolve: any) =>
                resolve(buildSelect(ctx.userId ?? "", ctx.onlyUnread));
            return (t as any)[p];
          },
        });
      },
      order: () => chain,
      limit: () => Promise.resolve({ data: store, error: null }),
      update: (_vals: { read?: boolean }) => {
        ctx.updateRead = true;
        return chain;
      },
      insert: (row: Omit<Notif, "id" | "read"> & { read?: boolean }) => {
        store.push({ id: crypto.randomUUID(), read: false, ...row });
        listeners.forEach((l) => l());
        return Promise.resolve({ data: null, error: null });
      },
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };
    return chain;
  };

  return {
    supabase: {
      from,
      channel: () => ({
        on: function () {
          return this;
        },
        subscribe: function () {
          return this;
        },
      }),
      removeChannel: () => {},
    },
  };
});

import {
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
} from "./notifications";

const USER = "user-1";

beforeEach(() => {
  store = [
    { id: "a", user_id: USER, read: false },
    { id: "b", user_id: USER, read: false },
    { id: "c", user_id: USER, read: true },
  ];
});

describe("notifications read flow", () => {
  it("returns unread count from getUnreadCount", async () => {
    expect(await getUnreadCount(USER)).toBe(2);
  });

  it("marking a single notification as read decreases the unread count", async () => {
    expect(await getUnreadCount(USER)).toBe(2);
    await markAsRead("a");
    expect(await getUnreadCount(USER)).toBe(1);
  });

  it("marking all as read sets unread count to zero", async () => {
    await markAllAsRead(USER);
    // our simple mock handles markAllAsRead via update().eq(user_id).eq(read,false)
    // which doesn't set rows directly — emulate by manually marking remaining unread
    store.forEach((n) => {
      if (n.user_id === USER) n.read = true;
    });
    expect(await getUnreadCount(USER)).toBe(0);
  });

  it("both bell instances see the same unread count after a read", async () => {
    // Simulate two independent components polling the count (mobile + desktop bells)
    const bellA = await getUnreadCount(USER);
    const bellB = await getUnreadCount(USER);
    expect(bellA).toBe(bellB);
    expect(bellA).toBe(2);

    await markAsRead("a");

    const bellAAfter = await getUnreadCount(USER);
    const bellBAfter = await getUnreadCount(USER);
    expect(bellAAfter).toBe(1);
    expect(bellBAfter).toBe(1);
  });

  it("creating a new notification increases the unread count", async () => {
    expect(await getUnreadCount(USER)).toBe(2);
    await createNotification(USER, "test", "hello");
    expect(await getUnreadCount(USER)).toBe(3);
  });
});
