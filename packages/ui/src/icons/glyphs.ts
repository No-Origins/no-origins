/**
 * The glyphs the system knows, in the system's words (Atomic.md D8). Named imports, so a bundle carries these and
 * not the other 1 200. Add one when a screen needs it; the registry's `icon` enum reads this list.
 *
 * `/dist/ssr` is Phosphor's context-free build: no provider, no "use client", so a server component can render one.
 */
export {
  HouseIcon as home,
  MagnifyingGlassIcon as search,
  FolderIcon as folder,
  ChatCircleIcon as message,
  PlusIcon as plus,
  MinusIcon as minus,
  XIcon as close,
  PushPinIcon as pin,
  SlidersHorizontalIcon as sliders,
  DotsSixVerticalIcon as grip,
  UserIcon as user,
  ArchiveIcon as archive,
  HeartIcon as heart,
  SquaresFourIcon as grid,
  StackIcon as layers,
  ArrowRightIcon as arrowRight,
  ArrowLeftIcon as arrowLeft,
  CaretDownIcon as caretDown,
  CaretRightIcon as caretRight,
  CheckIcon as check,
  WarningIcon as warning,
  InfoIcon as info,
  GearIcon as settings,
  SunIcon as sun,
  MoonIcon as moon,
  MonitorIcon as monitor,
  DeviceMobileIcon as phone,
  EyeIcon as eye,
  LinkIcon as link,
  DownloadSimpleIcon as download,
  DotsThreeIcon as more,
} from "@phosphor-icons/react/dist/ssr";
