import type { Prefs } from "./prefs";

export const DEFAULT_WISP = "wss://wisp.mercurywork.shop/";

type Controller = import("@mercuryworkshop/scramjet-controller").Controller;
type Frame = import("@mercuryworkshop/scramjet-controller").Frame;

let cache: { key: string; promise: Promise<Controller> } | null = null;

async function buildController(transport: Prefs["transport"], wisp: string): Promise<Controller> {
  const [{ Controller }, { default: EpoxyTransport }, { default: LibcurlClient }] = await Promise.all([
    import("@mercuryworkshop/scramjet-controller"),
    import("@mercuryworkshop/epoxy-transport"),
    import("@mercuryworkshop/libcurl-transport"),
  ]);

  const reg = await navigator.serviceWorker.register("/scramjet/controller.sw.js", { scope: "/scramjet/p/" });
  await navigator.serviceWorker.ready;
  const sw = reg.active;
  if (!sw) throw new Error("Proxy worker failed to start");

  const t = transport === "libcurl" ? new LibcurlClient({ wisp }) : new EpoxyTransport({ wisp });
  await t.init();

  return new Controller({
    serviceworker: sw,
    transport: t,
    config: {
      prefix: "/scramjet/p/",
      scramjetPath: "/scramjet/scramjet.js",
      injectPath: "/scramjet/controller.inject.js",
      wasmPath: "/scramjet/scramjet.wasm",
    },
  });
}

export function getProxyController(prefs: Prefs): Promise<Controller> {
  const key = `${prefs.transport}|${prefs.wisp || DEFAULT_WISP}`;
  if (!cache || cache.key !== key) {
    cache = { key, promise: buildController(prefs.transport, prefs.wisp || DEFAULT_WISP) };
    cache.promise.catch(() => { if (cache?.key === key) cache = null; });
  }
  return cache.promise;
}

export async function openProxied(iframe: HTMLIFrameElement, url: string, prefs: Prefs): Promise<Frame> {
  const controller = await getProxyController(prefs);
  const frame = controller.createFrame(iframe);
  frame.go(url);
  return frame;
}
