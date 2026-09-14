/**
 * @no-origins/ui — the No Origins design system.
 *
 * CSS: `@import "@no-origins/ui/index.css"` (tokens · glass · motion · components) and, on Tailwind 4 hosts,
 * `@import "@no-origins/ui/tailwind.css"`. The host provides the fonts as --ff-display / --ff-sans / --ff-mono.
 *
 * React, by layer (Atomic.md §1): tokens/ · atoms/ · molecules/ · organisms/ · templates/. A layer imports only the
 * layers before it (rule 3). The canvas template lives at `@no-origins/ui/canvas` (needs @xyflow/react) and the Icon
 * atom at `@no-origins/ui/icons` (needs @phosphor-icons/react) — the two optional peers, each behind its own entry.
 */
export const version = "0.1.0";

export { hues, blocks, blobSizes, breakpoints } from "./tokens/tokens";
export type { Hue, Block, BlobSize, Breakpoint } from "./tokens/tokens";

export { Blob } from "./atoms/blob/Blob";
export type { BlobProps, BlobVariant, BlobState } from "./atoms/blob/Blob";
export { GroundContext, GroundProvider, useGround, measureGround, REFRACTION_ZOOM } from "./atoms/blob/grid";
export type { Ground as GroundGeometry } from "./atoms/blob/grid";   /* the measured ground the blob refracts; `Ground` is the component */
export { LOOK_RANGE, LOOK_REACH } from "./atoms/blob/behaviour";

export { Wordmark } from "./atoms/Wordmark";
export type { WordmarkProps } from "./atoms/Wordmark";

export { Ground } from "./atoms/Ground";
export type { GroundProps } from "./atoms/Ground";
export { Glass } from "./atoms/Glass";
export type { GlassProps, GlassLevel, Radius } from "./atoms/Glass";
export { Button } from "./atoms/Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./atoms/Button";
export { Chip } from "./atoms/Chip";
export type { ChipProps } from "./atoms/Chip";
export { Card } from "./atoms/Card";
export type { CardProps } from "./atoms/Card";
export { Bubble } from "./atoms/Bubble";
export type { BubbleProps } from "./atoms/Bubble";
export { Field } from "./molecules/Field";
export type { FieldProps } from "./molecules/Field";
export { FieldShell } from "./molecules/FieldShell";
export type { FieldShellProps, FieldControlProps } from "./molecules/FieldShell";
export { Select } from "./molecules/Select";
export type { SelectProps, SelectOption, SelectGroup } from "./molecules/Select";
export { Checkbox } from "./molecules/Checkbox";
export type { CheckboxProps } from "./molecules/Checkbox";
export { Radio, RadioGroup } from "./molecules/Radio";
export type { RadioProps, RadioGroupProps, RadioOption } from "./molecules/Radio";
export { Segmented } from "./molecules/Segmented";
export type { SegmentedProps, SegmentedOption } from "./molecules/Segmented";
export { Tabs } from "./molecules/Tabs";
export type { TabsProps, Tab } from "./molecules/Tabs";
export { Toast, ToastStack } from "./molecules/Toast";
export type { ToastProps, ToastStackProps, ToastTone } from "./molecules/Toast";
export { Tooltip } from "./molecules/Tooltip";
export type { TooltipProps } from "./molecules/Tooltip";
export { Dots } from "./molecules/Dots";
export type { DotsProps } from "./molecules/Dots";
export { Toggle } from "./atoms/Toggle";
export type { ToggleProps } from "./atoms/Toggle";
export { Text } from "./atoms/Text";
export type { TextProps } from "./atoms/Text";
export { Stack } from "./atoms/Stack";
export type { StackProps } from "./atoms/Stack";
export { Row } from "./atoms/Row";
export type { RowProps } from "./atoms/Row";
export { Heading } from "./atoms/Heading";
export type { HeadingProps } from "./atoms/Heading";
export { Label } from "./atoms/Label";
export type { LabelProps } from "./atoms/Label";
export { Dot } from "./atoms/Dot";
export type { DotProps } from "./atoms/Dot";
export { Divider } from "./atoms/Divider";
export type { DividerProps } from "./atoms/Divider";
export { Image } from "./atoms/Image";
export type { ImageProps } from "./atoms/Image";
export { Deck } from "./organisms/Deck";
export type { DeckProps } from "./organisms/Deck";
export { Carousel } from "./organisms/Carousel";
export type { CarouselProps } from "./organisms/Carousel";
export { cx } from "./cx";

export { Page, Container, Section } from "./templates/Page";
export type { PageProps, ContainerProps, SectionProps } from "./templates/Page";
export { Tool, ToolScreen } from "./templates/Tool";
export type { ToolProps, ToolScreenProps } from "./templates/Tool";
export { Document } from "./templates/Document";
export type { DocumentProps } from "./templates/Document";
export { NavBar } from "./organisms/NavBar";
export type { NavBarProps, NavLink } from "./organisms/NavBar";
export { Menu } from "./organisms/Menu";
export type { MenuProps, MenuItem, MenuGroup, MenuForm } from "./organisms/Menu";
/** @deprecated `<Menu groups>` (Atomic.md D9); alias removed next minor. */
export { Rail } from "./organisms/Rail";
export type { RailProps, RailGroup, RailItem } from "./organisms/Rail";
export { Table } from "./organisms/Table";
export type { TableProps, TableColumn } from "./organisms/Table";
export { Dialog, Sheet } from "./organisms/Dialog";
export type { DialogProps } from "./organisms/Dialog";
export { Tree, moveTreeNode } from "./organisms/Tree";
export type { TreeProps, TreeNode, TreeMove } from "./organisms/Tree";
// The inspector controls (Admin.md §6.5a, 2026-09-14).
export { HueSwatch } from "./molecules/HueSwatch";
export type { HueSwatchProps, HueValue } from "./molecules/HueSwatch";
export { PatternPicker, libraryPatterns } from "./molecules/PatternPicker";
export type { PatternPickerProps, PatternOption } from "./molecules/PatternPicker";
export { Range } from "./molecules/Range";
export type { RangeProps } from "./molecules/Range";
export { Repeater } from "./molecules/Repeater";
export type { RepeaterProps } from "./molecules/Repeater";
export { PatternStudio, tidyFamily } from "./organisms/PatternStudio";
export type { PatternStudioProps } from "./organisms/PatternStudio";
export { SectionHeader } from "./molecules/SectionHeader";
export type { SectionHeaderProps } from "./molecules/SectionHeader";
export { Footer } from "./organisms/Footer";
export type { FooterProps } from "./organisms/Footer";
export { ThemeSwitch } from "./molecules/ThemeSwitch";
export type { ThemeSwitchProps } from "./molecules/ThemeSwitch";
export { themeBootScript, readTheme, applyTheme, subscribeTheme, THEME_STORAGE_KEY } from "./tokens/theme";
export type { ThemeChoice } from "./tokens/theme";

export { Bento, BentoCell, BentoFigure } from "./organisms/Bento";
export type { BentoProps, BentoCellProps, BentoFigureProps, BentoTone } from "./organisms/Bento";
// Patterns (Patterns.md; Admin.md §6.5b renamed them from illustrations on 2026-09-14 — the old names are aliases
// for one minor).
export { Pattern, PatternCanvas, Glyph, glyphNames, Illustration, IllustrationCanvas } from "./atoms/patterns/Pattern";
export type { PatternProps, PatternCanvasProps, IllustrationProps, IllustrationCanvasProps, GlyphProps, GlyphName, Line } from "./atoms/patterns/Pattern";
export { patterns, patternNames, patternNotes, fields, fieldNames } from "./atoms/patterns/patterns";
export type { PatternName, FieldName } from "./atoms/patterns/patterns";
export * as ill from "./atoms/patterns/primitives";
// The generator (Patterns.md §6.0a) — v1 of the one function that draws every pattern.
export { illo, illoLines, poly } from "./atoms/patterns/generator";
export type { Family, Drawn, Pt } from "./atoms/patterns/generator";
export { Placeholder } from "./atoms/Placeholder";
export type { PlaceholderProps } from "./atoms/Placeholder";
export { BlockCard } from "./organisms/BlockCard";
export type { BlockCardProps, BlockChip } from "./organisms/BlockCard";
/** @deprecated `<SectionHeader rhythm={false}>` (Atomic.md D3); alias removed next minor. */
export { Intro } from "./molecules/Intro";
export type { IntroProps } from "./molecules/Intro";
export { CellHead } from "./molecules/CellHead";
export type { CellHeadProps } from "./molecules/CellHead";
export { Speaker } from "./molecules/Speaker";
export type { SpeakerProps } from "./molecules/Speaker";
export { Steps, Step } from "./molecules/Steps";
export type { StepsProps, StepProps } from "./molecules/Steps";
export { ProfileCard } from "./organisms/ProfileCard";
export type { ProfileCardProps } from "./organisms/ProfileCard";
export { Quote } from "./organisms/Quote";
export type { QuoteProps } from "./organisms/Quote";
export { MediaCard } from "./organisms/MediaCard";
export type { MediaCardProps } from "./organisms/MediaCard";
/** @deprecated `<BlockCard state="sleep" line progress>` (Atomic.md D3); alias removed next minor. */
export { RoadmapItem } from "./organisms/RoadmapItem";
export type { RoadmapItemProps } from "./organisms/RoadmapItem";

export { ChatInput } from "./molecules/ChatInput";
export type { ChatInputProps, ChatSuggestion } from "./molecules/ChatInput";
