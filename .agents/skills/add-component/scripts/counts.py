#!/usr/bin/env python3
"""counts.py — the real component counts of @no-origins/ui, and every line that writes one down.

    python3 .claude/skills/add-component/scripts/counts.py        # from the repo root

Prints what is installed, what the showcase shows, what its footnote names, what falls through the gaps, and then
each line in the docs and the showcase that states a count, so every one of them can be made true. Changes nothing.
"""
import re
import subprocess
import sys
from pathlib import Path

# The checkout you are standing in (a worktree counts its own files), else the one this script lives in.
try:
    ROOT = Path(subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True,
                               check=True).stdout.strip())
except (subprocess.CalledProcessError, FileNotFoundError):
    ROOT = Path(__file__).resolve().parents[4]
COMPONENTS = ROOT / "packages/ui/src/components"
CONTENT = ROOT / "apps/design/src/content"

# The package's own files, not shadcn's — the grid layer, the slot and registry, Text, the portal, the theme, the agent,
# the colour picker, the liquid and his 3D figure. A new house file (not from the CLI) belongs here too, or it is
# counted as a shadcn component.
OURS = {"grid", "grid-pages", "grid-pager", "grid-intro", "slot", "registry", "text", "portal", "theme-provider",
        "agent", "colour-picker", "liquid", "hiddenstack-avatar"}

# Items on a showcase page that are not a component's specimen.
NOT_SPECIMENS = {"atoms", "molecules", "header", "not-shown"}


def kebab(name: str) -> str:
    """AlertDialog → alert-dialog, InputOTP → input-otp, NativeSelect → native-select."""
    return re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", "-", name).lower()


def specimens(page: str) -> list[str]:
    text = (CONTENT / f"{page}.tsx").read_text()
    return [i for i in re.findall(r'^\s+id: "([^"]+)",', text, re.M) if i not in NOT_SPECIMENS]


def footnote() -> list[str]:
    text = (CONTENT / "molecules.tsx").read_text()
    block = text[text.find('id: "not-shown"'):]
    return re.findall(r'<Text role="mono" as="code">([a-z0-9-]+)</Text>', block)


installed = sorted(p.stem for p in COMPONENTS.glob("*.tsx") if p.stem not in OURS)
# Every component file, the house's included: a house component's specimen is a specimen like any other.
every = {p.stem for p in COMPONENTS.glob("*.tsx")}
atoms, molecules, hidden = specimens("atoms"), specimens("molecules"), footnote()

print(f"installed  {len(installed)} shadcn components in packages/ui/src/components (not counting {', '.join(sorted(OURS))})")
print(f"atoms      {len(atoms)} specimens")
print(f"molecules  {len(molecules)} specimens")
print(f"footnote   {len(hidden)} named as not shown: {', '.join(hidden)}")

shown: dict[str, list[str]] = {}
for page, ids in (("atoms", atoms), ("molecules", molecules)):
    for i in ids:
        shown.setdefault(kebab(i), []).append(f"{page}:{i}")

extra = {k: v for k, v in shown.items() if k not in every}
twice = {k: v for k, v in shown.items() if k in installed and len(v) > 1}
both = sorted(set(hidden) & set(shown))
missing = sorted(set(installed) - set(shown) - set(hidden))
ghost = sorted(set(hidden) - set(installed))

if extra:
    print("\nspecimens that are not a component (a second demo, or a name that does not kebab to a file):")
    for k, v in sorted(extra.items()):
        print(f"  {', '.join(v)}")
if twice:
    print("\ncomponents with more than one specimen:")
    for k, v in sorted(twice.items()):
        print(f"  {k}: {', '.join(v)}")
if both:
    print(f"\nin the footnote AND shown: {', '.join(both)}")
if missing:
    print(f"\ninstalled, not shown, not in the footnote: {', '.join(missing)}")
if ghost:
    print(f"\nin the footnote, not installed: {', '.join(ghost)}")

shown_atoms = len({kebab(i) for i in atoms} & every)
shown_molecules = len({kebab(i) for i in molecules} & every)
print(f"\n→ the true numbers: {len(every)} components ({len(installed)} from shadcn, {len(every) - len(installed)} the house's); "
      f"atoms {shown_atoms}; "
      f"molecules {shown_molecules} shown + {len(hidden)} not shown = {shown_molecules + len(hidden)}")

# Every line that writes a count down. A bare "N components" is the system's total only when N is that big (prose
# says "two components" about other things), so small ones are skipped; the showcase's own phrasings are always
# reported.
SMALL = r"(?:one|two|three|four|five|six|seven|eight|nine|ten)"
BIG = r"(?:fifty|sixty|seventy|eighty)(?:-[a-z]+)?"
PATTERNS = [
    rf"\b(?:[3-9]\d|\d{{3,}}|{BIG})\s+(?:shadcn\s+)?components\b",
    r"\b(?:Atoms|Molecules)\s*·\s*\d+",
    r"\bthe\s+\d+\s+(?:indivisible|that compose)",
    rf"\b(?:\d+|{SMALL})\s+(?:without a specimen|are installed|components have no specimen)",
    rf"\bAll\s+(?:\d+|{SMALL})\s+are installed",
]
rx = re.compile("|".join(PATTERNS), re.I)
files = [ROOT / "CLAUDE.md", ROOT / "packages/ui/CLAUDE.md", ROOT / "apps/design/CLAUDE.md",
         *sorted(CONTENT.glob("*.tsx")),
         *sorted((ROOT / "packages/docs").rglob("*.md"))]

print("\nlines that state a count — make each one true:")
for f in files:
    if not f.exists():
        continue
    for n, line in enumerate(f.read_text().splitlines(), 1):
        for m in rx.finditer(line):
            print(f"  {f.relative_to(ROOT)}:{n}  “{m.group(0)}”")

sys.exit(0)
