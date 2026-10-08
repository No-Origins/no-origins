#!/usr/bin/env bash
# house-check.sh — list every line in a component that may break a house rule of @no-origins/ui.
#
#   .claude/skills/add-component/scripts/house-check.sh <file.tsx> [more files…]
#
# FIX  = almost always wrong in this system; change it or say why not.
# LOOK = sometimes right; read references/house-edits.md for the rule and decide.
# Nothing is changed. Exit status is 1 when any FIX is found, so it can gate a loop.

set -u
[ $# -eq 0 ] && { echo "usage: $0 <file.tsx> [more files…]" >&2; exit 2; }

B='(^|[[:space:]"'"'"'`:])'   # a class starts after a space, a quote, a backtick or a variant's colon
fixes=0
looks=0

code=$(mktemp)
trap 'rm -f "$code"' EXIT

# hit LEVEL RULE REGEX FILE — print each match as file:line  LEVEL [rule]  token. It greps $code, the file with its
# comment lines blanked (line numbers kept), so the prose of a divergence comment never matches.
hit() {
  local level=$1 rule=$2 re=$3 file=$4 out
  out=$(grep -noE "$re" "$code" 2>/dev/null) || return 0
  while IFS= read -r m; do
    local line=${m%%:*} tok=${m#*:}
    tok=${tok#"${tok%%[![:space:]\"\'\`:]*}"}   # trim the boundary characters the regex had to eat
    tok=${tok%"${tok##*[![:space:]\"\'\`]}"}
    printf '%s:%s  %-4s [%s]  %s\n' "$file" "$line" "$level" "$rule" "$tok"
    if [ "$level" = FIX ]; then fixes=$((fixes + 1)); else looks=$((looks + 1)); fi
  done <<< "$out"
}

for f in "$@"; do
  [ -f "$f" ] || { echo "no such file: $f" >&2; continue; }
  awk '
    inblock { print ""; if (index($0, "*/")) inblock = 0; next }
    /^[[:space:]]*\/\*/ { print ""; if (!index($0, "*/")) inblock = 1; next }
    /^[[:space:]]*(\/\/|\*)/ { print ""; next }
    { print }
  ' "$f" > "$code"

  # 1 radius — every box rounded-lg (Grid.md D39); sera arrives rounded-none
  hit FIX  radius "${B}rounded-(none|xs|sm|md|xl|2xl|3xl|4xl)" "$f"
  hit FIX  radius "${B}rounded-(t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee)-(xs|sm|md|xl|2xl|3xl|4xl)" "$f"
  hit LOOK radius "${B}rounded-(t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee)-none" "$f"   # a joined group's inner corners
  hit FIX  radius "${B}rounded([[:space:]\"'\`]|$)" "$f"
  hit LOOK radius "${B}rounded(-(t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?-(full|\[[^]i][^]]*\])" "$f"

  # 2 fields — outlined pills, never sera's underline (Grid.md D39)
  hit FIX  field  "${B}(border-b-input|border-transparent border-b|(focus-visible|aria-invalid|dark:aria-invalid):border-b-[a-z/0-9-]+)" "$f"

  # 3 motion — tokens, never literals (Motion.md M3, M4)
  hit FIX  motion "${B}(duration|delay)-[0-9]+" "$f"
  hit FIX  motion "${B}(zoom-(in|out)|slide-(in-from|out-to)-(top|bottom|left|right|start|end))-[0-9]+" "$f"
  hit LOOK motion "${B}ease-(in|out|in-out|linear)([[:space:]\"'\`]|$)" "$f"
  hit LOOK motion "${B}animate-\[[^]]+\]" "$f"

  # 4 portals — through usePortalContainer() (Motion.md M8)
  if out=$(grep -nE '<[A-Za-z]+Primitive\.Portal([[:space:]>]|$)' "$f" | grep -v 'container='); then
    while IFS= read -r m; do
      printf '%s:%s  FIX  [portal]  %s\n' "$f" "${m%%:*}" "Portal without container={usePortalContainer()}"
      fixes=$((fixes + 1))
    done <<< "$out"
  fi
  hit LOOK portal "createPortal\(" "$f"

  # 5 glass and gradients — none in the system (feedback: no glass, no gradients)
  hit FIX  glass  "${B}(supports-backdrop-filter:)?backdrop-(blur|saturate|brightness)(-[a-z0-9]+)?" "$f"
  hit FIX  glass  "${B}blur(-(none|xs|sm|md|lg|xl|2xl|3xl|\[[^]]+\]))?([[:space:]\"'\`]|$)" "$f"
  hit FIX  gradient "${B}bg-(gradient|linear|radial|conic)-[a-z0-9-]+" "$f"
  hit FIX  gradient "${B}(from|via|to)-(\[[^]]+\]|[a-z]+(-[0-9]+)?)" "$f"
  hit LOOK colour "${B}bg-(muted|accent|input|background|card|popover|black|white)/[0-9]+" "$f"   # mixed, never translucent

  # 6 colour — lime text is ~1.3:1 on white
  hit LOOK colour "${B}text-primary([[:space:]\"'\`/]|$)" "$f"

  # 7 blending — isolate the root, or it becomes a cloth's backdrop root (avatar.tsx)
  if grep -qE 'mix-blend-' "$f" && ! grep -qE "${B}isolate" "$f"; then
    hit FIX blend "${B}mix-blend-[a-z-]+" "$f"
  fi

  # 8 divergence comments — rule 6; only a reminder, the script cannot know what diverged
  if ! grep -qE '(//|/\*).*(Diverged from|Motion\.md M8|Grid(-v2)?\.md D39)' "$f"; then
    printf '%s     NOTE [comment]  no divergence comment yet — every house edit but the radius says why (rule 6)\n' "$f"
  fi
done

echo "— $fixes to fix, $looks to look at"
[ "$fixes" -eq 0 ]
