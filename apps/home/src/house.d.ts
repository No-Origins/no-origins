/**
 * `@house`, the house the app is built with (Home.md H4): `src/content` on his machine, the made-up `src/sample`
 * anywhere else — chosen by the bundler's alias in `next.config.ts`, which looks for the folder. Both export these two,
 * and each checks its own against the types where it is written.
 */
declare module "@house" {
  export const HOME: import("@/lib/house").House;
  export const HOME_TOUR: import("@/lib/tour").Tour;
}
