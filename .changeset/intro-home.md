---
"@no-origins/ui": minor
---

The intro's agents go home and stay (Grid.md D50, Motion.md M22, version 8).

- **`introHome`**: each agent's cell once the intro is over, the cast one above the other in the field's last column,
  centred down it, in its order.
- **Its dive into its nest is the Dive action to that cell**: `introPlan` takes `homes` and plays his Dive from each
  nest once its ripple has spread and its landing has come to rest. `IntroPart` has `home`, `gone` (when it is behind
  the page; its boxes fade in from then) and `settled`. `introSink` and the `dive` token went with version 7's own sink;
  `introNestLeft` takes the part and the moment only.
- **They stay**: `GridIntro` is mounted from the intro on and takes `settled`. Once the grid lets go of the page it
  goes on drawing the cast resting in its cells, and on a field it has not planned for, or where the intro never
  played, it draws them there resting (`introResting`), once and still under reduced motion.
- **`AgentActionPlay.gone`**: when a dive is gone behind the page.
