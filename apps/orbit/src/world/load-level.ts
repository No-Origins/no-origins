/** Start every item together; present each result on arrival. A level completes
 * only after every item has finished presenting, including when a peer fails.
 * CPU geometry builders must yield or use workers; promises alone do not make
 * synchronous construction parallel. Downloads and async preparation may overlap.
 */
export async function loadLevelItems<T>(items: readonly T[], present: (item: T) => Promise<void>) {
  const results = await Promise.allSettled(items.map(present));
  const failed = results.find(result => result.status === "rejected");
  if (failed?.status === "rejected") throw failed.reason;
}
