import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installPreloadErrorRecovery, recoverFromStaleCache, resetRecoveryFlagForTests,
} from '../src/utils/sw-recovery';

const FLAG = 'fateverse:sw-recovered';

let unregister: ReturnType<typeof vi.fn>;
let cacheDelete: ReturnType<typeof vi.fn>;
let reload: ReturnType<typeof vi.fn>;
let deleteDatabase: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetRecoveryFlagForTests();
  window.sessionStorage.clear();

  unregister = vi.fn().mockResolvedValue(true);
  cacheDelete = vi.fn().mockResolvedValue(true);
  reload = vi.fn();
  deleteDatabase = vi.fn();

  vi.stubGlobal('navigator', {
    serviceWorker: { getRegistrations: async () => [{ unregister }, { unregister }] },
  });
  vi.stubGlobal('caches', {
    keys: async () => ['workbox-precache-v2', 'fateverse-runtime'],
    delete: cacheDelete,
  });
  vi.stubGlobal('indexedDB', { deleteDatabase, open: vi.fn() });
  // jsdom 的 location.reload 不能直接 spy，改成換掉整個屬性。
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

describe('舊快取自我復原', () => {
  it('清掉所有 Cache Storage、解除所有 SW，並只重載一次', async () => {
    await expect(recoverFromStaleCache()).resolves.toBe(true);

    expect(cacheDelete).toHaveBeenCalledTimes(2);
    expect(cacheDelete).toHaveBeenCalledWith('workbox-precache-v2');
    expect(cacheDelete).toHaveBeenCalledWith('fateverse-runtime');
    expect(unregister).toHaveBeenCalledTimes(2);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('復原過程完全不碰 IndexedDB', async () => {
    await recoverFromStaleCache();
    expect(deleteDatabase).not.toHaveBeenCalled();
  });

  it('復原過程不清除 localStorage 的偏好', async () => {
    window.localStorage.setItem('fateverse:theme', 'dark');
    await recoverFromStaleCache();
    expect(window.localStorage.getItem('fateverse:theme')).toBe('dark');
  });

  it('sessionStorage 旗標已存在時，不清除也不重載', async () => {
    window.sessionStorage.setItem(FLAG, '1');

    await expect(recoverFromStaleCache()).resolves.toBe(false);
    expect(cacheDelete).not.toHaveBeenCalled();
    expect(unregister).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('同一個 session 內連續呼叫只會復原一次', async () => {
    await recoverFromStaleCache();
    await recoverFromStaleCache();
    await recoverFromStaleCache();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('同一輪同時觸發兩次也只重載一次（旗標在 await 之前就寫下）', async () => {
    await Promise.all([recoverFromStaleCache(), recoverFromStaleCache()]);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(unregister).toHaveBeenCalledTimes(2); // 只有第一次那輪的兩個 registration
  });

  it('sessionStorage 不可用時，記憶體旗標仍擋得住第二次', async () => {
    const broken = {
      getItem: () => { throw new Error('storage disabled'); },
      setItem: () => { throw new Error('storage disabled'); },
    };
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage')!;
    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: broken });
    try {
      await recoverFromStaleCache();
      await recoverFromStaleCache();
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, 'sessionStorage', original);
    }
  });
});

describe('vite:preloadError 監聽', () => {
  it('觸發事件會啟動復原，並攔下預設的往外拋', async () => {
    const stop = installPreloadErrorRecovery();
    const event = new Event('vite:preloadError', { cancelable: true });

    window.dispatchEvent(event);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));

    expect(event.defaultPrevented).toBe(true);
    expect(cacheDelete).toHaveBeenCalled();
    expect(unregister).toHaveBeenCalled();
    stop();
  });

  it('已復原過的 session 再次觸發：不清除、不重載，也不攔錯誤', async () => {
    window.sessionStorage.setItem(FLAG, '1');
    const stop = installPreloadErrorRecovery();
    const event = new Event('vite:preloadError', { cancelable: true });

    window.dispatchEvent(event);
    await Promise.resolve();

    expect(event.defaultPrevented).toBe(false);
    expect(cacheDelete).not.toHaveBeenCalled();
    expect(unregister).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    stop();
  });

  it('連續兩次 preloadError 只會重載一次', async () => {
    const stop = installPreloadErrorRecovery();

    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
    await Promise.resolve();

    expect(reload).toHaveBeenCalledTimes(1);
    stop();
  });

  it('解除監聽後不再反應', async () => {
    const stop = installPreloadErrorRecovery();
    stop();

    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
    await Promise.resolve();
    expect(reload).not.toHaveBeenCalled();
  });
});
