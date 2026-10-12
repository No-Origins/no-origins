import { cloudJob, type CloudJob } from "./cloud-job";
let cache: ReturnType<typeof cloudJob>["cache"] | undefined;
self.onmessage = (event: MessageEvent<CloudJob>) => {
  const result = cloudJob(event.data, cache); cache = result.cache;
  // Keep a local density copy for subsequent sunlight updates; transfer only the reply's copy.
  const density = { ...result.reply.density, data: result.reply.density.data.slice() };
  self.postMessage({ ...result.reply, density }, { transfer: [density.data.buffer, result.reply.lighting.data.buffer] });
};
