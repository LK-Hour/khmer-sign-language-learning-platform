// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWordRealtimePredictor } from "./useWordRealtimePredictor";

vi.mock("@/store/auth.store", () => ({ useAuthStore: { getState: () => ({ user: { is_guest: true } }) } }));
vi.mock("@/utils/api/client", () => ({ refreshAuthSession: vi.fn() }));
vi.mock("@/utils/localGuest", () => ({ getOrCreateLocalGuestId: () => "guest_test" }));
class Socket {
  static OPEN = 1;
  static CONNECTING = 0;
  static instances: Socket[] = [];
  readyState = 0;
  sent: Record<string, unknown>[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() { Socket.instances.push(this); }
  send(value: string) { this.sent.push(JSON.parse(value)); }
  open() { this.readyState = 1; this.onopen?.(); }
  receive(data: object) { this.onmessage?.({ data: JSON.stringify(data) }); }
  close() { this.readyState = 3; this.onclose?.({ code: 1000 }); }
}
beforeEach(() => { vi.useFakeTimers(); Socket.instances = []; vi.stubGlobal("WebSocket", Socket); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
function ready() {
  const hook = renderHook(() => useWordRealtimePredictor());
  act(() => hook.result.current.connect());
  const socket = Socket.instances[0];
  act(() => { socket.open(); socket.receive({ type: "auth_ok" }); });
  return { ...hook, socket };
}
function reply(request: object, extra = {}) {
  return { ...request, type: "prediction", label: "hello", confidence: 95, labelMatches: true, ...extra };
}
describe("word prediction flow", () => {
  it("allows one outstanding request and builds only the next fresh sequence", () => {
    const { result, socket } = ready();
    const build = vi.fn(() => new Float32Array([1]));
    act(() => { expect(result.current.sendFeatures(build, "hello")).toBe(true); });
    act(() => { expect(result.current.sendFeatures(build, "hello")).toBe(false); });
    expect(build).toHaveBeenCalledTimes(1);
    const request = socket.sent.at(-1)!;
    act(() => socket.receive(reply(request)));
    expect(result.current.livePrediction.label).toBe("hello");
    act(() => { expect(result.current.sendFeatures(() => new Float32Array([9]), "hello")).toBe(true); });
    expect(socket.sent.at(-1)?.features).toEqual([9]);
  });
  it("drains an old attempt without accepting its result or queuing more work", () => {
    const { result, socket } = ready();
    act(() => { result.current.sendFeatures([1], "hello"); });
    const old = socket.sent.at(-1)!;
    act(() => result.current.resetLivePrediction());
    act(() => { expect(result.current.sendFeatures([2], "world")).toBe(false); });
    act(() => socket.receive(reply(old)));
    expect(result.current.livePrediction.label).toBeNull();
    act(() => { expect(result.current.sendFeatures([2], "world")).toBe(true); });
    const fresh = socket.sent.at(-1)!;
    act(() => socket.receive(reply(old)));
    act(() => { expect(result.current.sendFeatures([3])).toBe(false); });
    act(() => socket.receive(reply(fresh, { label: "world" })));
    expect(result.current.livePrediction.label).toBe("world");
  });
  it("recovers from a correlated inference error with the next sample", () => {
    const { result, socket } = ready();
    act(() => { result.current.sendFeatures([1]); });
    act(() => socket.receive({ ...socket.sent.at(-1), type: "error", message: "Prediction failed" }));
    expect(result.current.connectionState).toBe("ready");
    act(() => { expect(result.current.sendFeatures([2])).toBe(true); });
  });
  it("reconnects on timeout, ignores the old socket and clears timers on unmount", () => {
    const { result, socket, unmount } = ready();
    act(() => { result.current.sendFeatures([1]); });
    const old = socket.sent.at(-1)!;
    act(() => vi.advanceTimersByTime(10500));
    expect(Socket.instances).toHaveLength(2);
    act(() => socket.receive(reply(old)));
    expect(result.current.livePrediction.label).toBeNull();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("does not send before authentication", () => {
    const { result } = renderHook(() => useWordRealtimePredictor());
    act(() => result.current.connect());
    act(() => Socket.instances[0].open());
    expect(result.current.sendFeatures([1])).toBe(false);
  });
});
