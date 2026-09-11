/**
 * @no-origins/ui — the No Origins design system.
 *
 * CSS: `@import "@no-origins/ui/index.css"` (tokens · glass · motion · components) and, on Tailwind 4 hosts,
 * `@import "@no-origins/ui/tailwind.css"`. The host provides the fonts as --ff-display / --ff-sans / --ff-mono.
 *
 * React: Blob, Wordmark (step 2) · Glass, Button, Chip, Card, Bubble, Field, Toggle (step 3) · Page, Container,
 * Section, NavBar, SectionHeader, Footer, ThemeSwitch (step 4). ChatInput arrives with the canvas. The canvas lives at `@no-origins/ui/canvas` (needs @xyflow/react).
 */
export const version = "0.0.1";

export { hues, blocks, blobSizes } from "./tokens";
export type { Hue, Block, BlobSize } from "./tokens";

export { Blob } from "./blob/Blob";
export type { BlobProps, BlobVariant, BlobState } from "./blob/Blob";
export { GroundContext, GroundProvider, useGround, measureGround, REFRACTION_ZOOM } from "./blob/grid";
export type { Ground } from "./blob/grid";
export { LOOK_RANGE, LOOK_REACH } from "./blob/behaviour";

export { Wordmark } from "./wordmark/Wordmark";
export type { WordmarkProps } from "./wordmark/Wordmark";

export { Glass } from "./primitives/Glass";
export type { GlassProps, GlassLevel, Radius } from "./primitives/Glass";
export { Button } from "./primitives/Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./primitives/Button";
export { Chip } from "./primitives/Chip";
export type { ChipProps } from "./primitives/Chip";
export { Card } from "./primitives/Card";
export type { CardProps } from "./primitives/Card";
export { Bubble } from "./primitives/Bubble";
export type { BubbleProps } from "./primitives/Bubble";
export { Field } from "./primitives/Field";
export type { FieldProps } from "./primitives/Field";
export { Toggle } from "./primitives/Toggle";
export type { ToggleProps } from "./primitives/Toggle";
export { Text } from "./primitives/Text";
export type { TextProps } from "./primitives/Text";
export { Stack } from "./primitives/Stack";
export type { StackProps } from "./primitives/Stack";
export { Row } from "./primitives/Row";
export type { RowProps } from "./primitives/Row";
export { Heading } from "./primitives/Heading";
export type { HeadingProps } from "./primitives/Heading";
export { Label } from "./primitives/Label";
export type { LabelProps } from "./primitives/Label";
export { Dot } from "./primitives/Dot";
export type { DotProps } from "./primitives/Dot";
export { Divider } from "./primitives/Divider";
export type { DividerProps } from "./primitives/Divider";
export { Image } from "./primitives/Image";
export type { ImageProps } from "./primitives/Image";
export { Carousel } from "./primitives/Carousel";
export type { CarouselProps } from "./primitives/Carousel";
export { cx } from "./cx";

export { Page, Container, Section } from "./layout/Layout";
export type { PageProps, ContainerProps, SectionProps } from "./layout/Layout";
export { NavBar } from "./layout/NavBar";
export type { NavBarProps, NavLink } from "./layout/NavBar";
export { SectionHeader } from "./layout/SectionHeader";
export type { SectionHeaderProps } from "./layout/SectionHeader";
export { Footer } from "./layout/Footer";
export type { FooterProps } from "./layout/Footer";
export { ThemeSwitch } from "./layout/ThemeSwitch";
export type { ThemeSwitchProps } from "./layout/ThemeSwitch";
export { themeBootScript, readTheme, applyTheme, subscribeTheme, THEME_STORAGE_KEY } from "./theme";
export type { ThemeChoice } from "./theme";

export { Bento, BentoCell, BentoFigure } from "./primitives/Bento";
export type { BentoProps, BentoCellProps, BentoFigureProps, BentoTone } from "./primitives/Bento";
export { Illustration, IllustrationCanvas, Glyph, glyphNames } from "./illustrations/Illustration";
export type { IllustrationProps, IllustrationCanvasProps, GlyphProps, GlyphName, Line } from "./illustrations/Illustration";
export { fields, fieldNames } from "./illustrations/fields";
export type { FieldName } from "./illustrations/fields";
export * as ill from "./illustrations/primitives";
// The generator (Illustrations.md §6.0a) — v1 of the one function that draws every illustration.
export { illo, illoLines, poly } from "./illustrations/generator";
export type { Family, Drawn, Pt } from "./illustrations/generator";
export { Placeholder } from "./primitives/Placeholder";
export type { PlaceholderProps } from "./primitives/Placeholder";
export { BlockCard } from "./blocks/BlockCard";
export type { BlockCardProps, BlockChip } from "./blocks/BlockCard";
export { SectionWidget } from "./blocks/SectionWidget";
export type { SectionWidgetProps } from "./blocks/SectionWidget";
export { Intro } from "./blocks/Intro";
export type { IntroProps } from "./blocks/Intro";
export { CellHead } from "./blocks/CellHead";
export type { CellHeadProps } from "./blocks/CellHead";
export { RegionLabel } from "./blocks/RegionLabel";
export type { RegionLabelProps } from "./blocks/RegionLabel";
export { Steps, Step } from "./blocks/Steps";
export type { StepsProps, StepProps } from "./blocks/Steps";
export { Quote } from "./blocks/Quote";
export type { QuoteProps } from "./blocks/Quote";
export { MediaCard } from "./blocks/MediaCard";
export type { MediaCardProps } from "./blocks/MediaCard";
export { RoadmapItem } from "./blocks/RoadmapItem";
export type { RoadmapItemProps } from "./blocks/RoadmapItem";

export { ChatInput } from "./primitives/ChatInput";
export type { ChatInputProps, ChatSuggestion } from "./primitives/ChatInput";
