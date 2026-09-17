"use client";

import * as React from "react";
import {
  BellIcon,
  ChevronRightIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  InboxIcon,
  LayoutDashboardIcon,
  MoreHorizontalIcon,
  SearchIcon,
  SettingsIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@no-origins/ui/components/accordion";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@no-origins/ui/components/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@no-origins/ui/components/alert-dialog";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentTitle,
} from "@no-origins/ui/components/attachment";
import { Avatar, AvatarFallback } from "@no-origins/ui/components/avatar";
import { Badge } from "@no-origins/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@no-origins/ui/components/breadcrumb";
import { Bubble, BubbleContent, BubbleGroup } from "@no-origins/ui/components/bubble";
import { Button } from "@no-origins/ui/components/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@no-origins/ui/components/button-group";
import { Calendar } from "@no-origins/ui/components/calendar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@no-origins/ui/components/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@no-origins/ui/components/carousel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@no-origins/ui/components/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@no-origins/ui/components/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@no-origins/ui/components/context-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@no-origins/ui/components/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@no-origins/ui/components/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@no-origins/ui/components/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@no-origins/ui/components/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@no-origins/ui/components/field";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@no-origins/ui/components/hover-card";
import { Input } from "@no-origins/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@no-origins/ui/components/input-group";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@no-origins/ui/components/input-otp";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@no-origins/ui/components/item";
import { Label } from "@no-origins/ui/components/label";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@no-origins/ui/components/menubar";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
} from "@no-origins/ui/components/message";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@no-origins/ui/components/navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@no-origins/ui/components/pagination";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@no-origins/ui/components/popover";
import { RadioGroup, RadioGroupItem } from "@no-origins/ui/components/radio-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@no-origins/ui/components/resizable";
import { ScrollArea } from "@no-origins/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@no-origins/ui/components/select";
import { Separator } from "@no-origins/ui/components/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@no-origins/ui/components/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@no-origins/ui/components/sidebar";
import { Skeleton } from "@no-origins/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@no-origins/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@no-origins/ui/components/tabs";
import { Textarea } from "@no-origins/ui/components/textarea";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@no-origins/ui/components/tooltip";

import { LayerHeader, Reading, Specimen } from "@/components/specimen";

const ROWS = [
  { id: "NO-101", block: "Portfolio", status: "Live", updated: "2026-09-14" },
  { id: "NO-102", block: "Design", status: "Live", updated: "2026-09-16" },
  { id: "NO-103", block: "Admin", status: "Draft", updated: "2026-09-16" },
];

export default function MoleculesPage() {
  return (
    <Reading>
      <LayerHeader
        title="Molecules"
        count={42}
        note="Two or more atoms with a job between them — a field and its label, a trigger and its menu, a surface and the rows inside it. Everything here composes the layer below and nothing above it."
      />

      <Specimen name="Accordion" note="Sections that open one at a time, or many.">
        <Accordion type="single" collapsible className="w-full max-w-lg">
          <AccordionItem value="a">
            <AccordionTrigger>What is in the package?</AccordionTrigger>
            <AccordionContent>Sixty-one components, the theme, and the `cn` helper. Nothing else.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Who consumes it?</AccordionTrigger>
            <AccordionContent>The portfolio, the showcase and the admin — from source, never from a build.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Specimen>

      <Specimen name="Alert" note="A standing message on the page, not a transient one.">
        <Alert className="max-w-lg">
          <BellIcon />
          <AlertTitle>The design system was rebuilt</AlertTitle>
          <AlertDescription>Every component below now comes from shadcn/ui.</AlertDescription>
        </Alert>
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>Three apps do not build</AlertTitle>
          <AlertDescription>Their pages still import the old system.</AlertDescription>
          <AlertAction>
            <Button size="xs" variant="outline">
              Fix
            </Button>
          </AlertAction>
        </Alert>
      </Specimen>

      <Specimen name="AlertDialog" note="A question you must answer before anything else happens.">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete block</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this block?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the block and everything in it. It cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Specimen>

      <Specimen name="Attachment" note="A file that came with a message.">
        <AttachmentGroup className="max-w-md">
          <Attachment>
            <AttachmentContent>
              <AttachmentTitle>Design-System.md</AttachmentTitle>
              <AttachmentDescription>98 KB</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
          <Attachment>
            <AttachmentContent>
              <AttachmentTitle>Atomic.md</AttachmentTitle>
              <AttachmentDescription>37 KB</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        </AttachmentGroup>
      </Specimen>

      <Specimen name="Breadcrumb" note="Where you are, and the way back up.">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Design</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/molecules">Molecules</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Specimen>

      <Specimen name="Bubble" note="One turn of a conversation.">
        <BubbleGroup className="w-full max-w-md">
          <Bubble variant="secondary">
            <BubbleContent>Rebuild the design system on shadcn.</BubbleContent>
          </Bubble>
          <Bubble>
            <BubbleContent>Sixty-one components installed. Take a look.</BubbleContent>
          </Bubble>
        </BubbleGroup>
      </Specimen>

      <Specimen name="ButtonGroup" note="Buttons that act as one control.">
        <ButtonGroup>
          <Button variant="outline">Day</Button>
          <Button variant="outline">Week</Button>
          <Button variant="outline">Month</Button>
        </ButtonGroup>
        <ButtonGroup>
          <ButtonGroupText>https://</ButtonGroupText>
          <ButtonGroupSeparator />
          <Button variant="outline">no-origins.com</Button>
        </ButtonGroup>
      </Specimen>

      <Specimen name="Calendar" note="A month, and the day you picked in it.">
        <Calendar mode="single" defaultMonth={new Date(2026, 8, 1)} className="rounded-none border" />
      </Specimen>

      <Specimen name="Card" note="The surface everything else sits on.">
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>bhargav.no-origins.com</CardDescription>
            <CardAction>
              <Badge variant="secondary">Live</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Static output, no database anywhere near it. That is deliberate.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Open</Button>
          </CardFooter>
        </Card>
      </Specimen>

      <Specimen name="Carousel" note="A row you page through. Its arrows hang 48px outside it, so it is inset far enough that they land on the page.">
        <div className="w-full max-w-sm px-14">
          <Carousel className="w-full">
            <CarouselContent>
              {[1, 2, 3, 4].map((n) => (
                <CarouselItem key={n} className="basis-1/2">
                  <Card>
                    <CardContent className="flex h-24 items-center justify-center">
                      <span className="font-heading text-2xl font-bold">{n}</span>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </Specimen>

      <Specimen name="Collapsible" note="One thing that folds away.">
        <Collapsible className="w-72">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Three routes <ChevronRightIcon />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {["/", "/atoms", "/molecules"].map((r) => (
              <div key={r} className="border px-3 py-2 font-mono text-xs">
                {r}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </Specimen>

      <Specimen name="Command" note="Search over actions — the palette, inline.">
        <Command className="w-80 border">
          <CommandInput placeholder="Type a command…" />
          <CommandList>
            <CommandEmpty>Nothing matches.</CommandEmpty>
            <CommandGroup heading="Blocks">
              <CommandItem>
                <LayoutDashboardIcon /> Portfolio
                <CommandShortcut>⌘1</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <FolderIcon /> Design
                <CommandShortcut>⌘2</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <SettingsIcon /> Admin
                <CommandShortcut>⌘3</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </Specimen>

      <Specimen name="ContextMenu" note="The right-click menu.">
        <ContextMenu>
          <ContextMenuTrigger className="flex h-24 w-72 items-center justify-center border border-dashed text-sm">
            Right-click here
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Open <ContextMenuShortcut>⌘O</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>Rename</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              <TrashIcon /> Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Specimen>

      <Specimen name="Dialog" note="A modal you can dismiss.">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename block</DialogTitle>
              <DialogDescription>The slug follows the name. Existing links keep working.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="rename">Name</Label>
              <Input id="rename" defaultValue="Portfolio" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Specimen>

      <Specimen name="Drawer" note="The modal, from the edge — the phone's answer to a dialog.">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerDescription>Narrow the list without leaving it.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>Apply</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Specimen>

      <Specimen name="DropdownMenu" note="Actions hung off a button.">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Account <ChevronRightIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Signed in</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon /> Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCardIcon /> Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Specimen>

      <Specimen name="Empty" note="What a list looks like before it has anything in it.">
        <Empty className="w-full max-w-md border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No blocks yet</EmptyTitle>
            <EmptyDescription>Create one and it will show up here.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm">New block</Button>
          </EmptyContent>
        </Empty>
      </Specimen>

      <Specimen name="Field" note="A label, a control, its help and its error — the unit every form is built from.">
        <FieldSet className="w-full max-w-md">
          <FieldLegend>Block</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="f-name">Name</FieldLabel>
              <Input id="f-name" placeholder="Portfolio" />
              <FieldDescription>Shown in the menu and the page title.</FieldDescription>
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="f-slug">Slug</FieldLabel>
              <Input id="f-slug" defaultValue="Portfolio!" aria-invalid />
              <FieldError>Lowercase letters, numbers and hyphens only.</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="f-note">Note</FieldLabel>
              <Textarea id="f-note" rows={2} />
            </Field>
          </FieldGroup>
        </FieldSet>
      </Specimen>

      <Specimen name="HoverCard" note="A preview that costs no click.">
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">@no-origins</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-72">
            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback>NO</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">No Origins</p>
                <p className="text-muted-foreground text-sm">Editors, design systems and agent tools.</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </Specimen>

      <Specimen name="InputGroup" note="An input with something attached to it.">
        <InputGroup className="w-72">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search components" />
        </InputGroup>
        <InputGroup className="w-72">
          <InputGroupInput placeholder="no-origins" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>.com</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup className="w-72">
          <InputGroupInput placeholder="Paste a link" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton>Go</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Specimen>

      <Specimen name="InputOTP" note="A one-time code, one character per box.">
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </Specimen>

      <Specimen name="Item" note="A row in a list: media, text, actions.">
        <ItemGroup className="w-full max-w-md border">
          <Item>
            <ItemMedia variant="icon">
              <FileTextIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Design-System.md</ItemTitle>
              <ItemDescription>Updated 16 September</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="ghost" size="icon-sm" aria-label="More">
                <MoreHorizontalIcon />
              </Button>
            </ItemActions>
          </Item>
          <Item>
            <ItemMedia variant="icon">
              <FileTextIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Atomic.md</ItemTitle>
              <ItemDescription>Updated 16 September</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="ghost" size="icon-sm" aria-label="More">
                <MoreHorizontalIcon />
              </Button>
            </ItemActions>
          </Item>
        </ItemGroup>
      </Specimen>

      <Specimen name="Menubar" note="The application menu bar.">
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>Open</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Export</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
              <MenubarItem>Redo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Atoms</MenubarItem>
              <MenubarItem>Molecules</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </Specimen>

      <Specimen name="Message" note="A turn with an author attached.">
        <MessageGroup className="w-full max-w-md">
          <Message>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>B</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>Which components are in?</MessageContent>
          </Message>
          <Message>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>NO</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>All of them — accordion through tooltip.</MessageContent>
          </Message>
        </MessageGroup>
      </Specimen>

      <Specimen name="NavigationMenu" note="Top-level navigation with panels under it.">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Layers</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-64 gap-1 p-2">
                  <NavigationMenuLink href="/atoms">Atoms</NavigationMenuLink>
                  <NavigationMenuLink href="/molecules">Molecules</NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Blocks</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-64 gap-1 p-2">
                  <NavigationMenuLink href="/">Portfolio</NavigationMenuLink>
                  <NavigationMenuLink href="/">Admin</NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </Specimen>

      <Specimen name="Pagination" note="Page n of many.">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Specimen>

      <Specimen name="Popover" note="A panel anchored to what opened it.">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <PopoverHeader>
              <PopoverTitle>Dimensions</PopoverTitle>
              <PopoverDescription>Set the width and height of the cell.</PopoverDescription>
            </PopoverHeader>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Input placeholder="W" />
              <Input placeholder="H" />
            </div>
          </PopoverContent>
        </Popover>
      </Specimen>

      <Specimen name="RadioGroup" note="One of several, and only one.">
        <RadioGroup defaultValue="design" className="space-y-2">
          {["portfolio", "design", "admin"].map((value) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`r-${value}`} />
              <Label htmlFor={`r-${value}`} className="capitalize">
                {value}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </Specimen>

      <Specimen name="Resizable" note="Panels the reader sets the width of.">
        <ResizablePanelGroup className="h-40 w-full max-w-lg border">
          <ResizablePanel defaultSize={35}>
            <div className="flex h-full items-center justify-center text-sm">Menu</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65}>
            <div className="flex h-full items-center justify-center text-sm">Screen</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Specimen>

      <Specimen name="ScrollArea" note="A styled scroller, so the bar matches the theme.">
        <ScrollArea className="h-40 w-72 border p-3">
          <div className="space-y-2">
            {Array.from({ length: 16 }, (_, i) => (
              <p key={i} className="text-sm">
                Line {i + 1}
              </p>
            ))}
          </div>
        </ScrollArea>
      </Specimen>

      <Specimen name="Select" note="A dropdown that is ours rather than the platform's.">
        <Select defaultValue="design">
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Pick a block" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Blocks</SelectLabel>
              <SelectItem value="portfolio">Portfolio</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Specimen>

      <Specimen name="Sheet" note="A panel that slides in from an edge and keeps the page behind it.">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Block settings</SheetTitle>
              <SheetDescription>Changes apply the moment you save.</SheetDescription>
            </SheetHeader>
            <div className="space-y-2 px-4">
              <Label htmlFor="sheet-name">Name</Label>
              <Input id="sheet-name" defaultValue="Design" />
            </div>
            <SheetFooter>
              <Button>Save</Button>
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Specimen>

      <Specimen name="Sidebar" note="The column a tool navigates by. Shown here with `collapsible=none`, which renders it inline.">
        <SidebarProvider className="min-h-0 w-full max-w-md border">
          <Sidebar collapsible="none" className="h-56">
            <SidebarHeader className="font-heading text-xs font-bold tracking-widest uppercase">
              No Origins
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Blocks</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {[
                      { label: "Portfolio", icon: LayoutDashboardIcon },
                      { label: "Design", icon: FolderIcon },
                      { label: "Admin", icon: SettingsIcon },
                    ].map((entry) => (
                      <SidebarMenuItem key={entry.label}>
                        <SidebarMenuButton>
                          <entry.icon /> {entry.label}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </Specimen>

      <Specimen name="Sonner" note="The transient message. It stacks bottom-right and leaves on its own.">
        <Button variant="outline" onClick={() => toast("Block saved", { description: "Design — 16 September" })}>
          Toast
        </Button>
        <Button variant="outline" onClick={() => toast.success("Published")}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast.error("Could not reach Supabase")}>
          Error
        </Button>
      </Specimen>

      <Specimen name="Table" note="Rows and columns, with a caption that says what they are.">
        <Table className="max-w-lg">
          <TableCaption>Three blocks.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">{row.id}</TableCell>
                <TableCell>{row.block}</TableCell>
                <TableCell>
                  <Badge variant={row.status === "Live" ? "default" : "secondary"}>{row.status}</Badge>
                </TableCell>
                <TableCell className="text-end font-mono text-xs">{row.updated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Specimen>

      <Specimen name="Tabs" note="One surface, several views of it.">
        <Tabs defaultValue="overview" className="w-full max-w-lg">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4 text-sm">
            Three apps, one package, sixty-one components.
          </TabsContent>
          <TabsContent value="routes" className="pt-4 text-sm">
            <code className="font-mono text-xs">/ · /atoms · /molecules</code>
          </TabsContent>
          <TabsContent value="settings" className="pt-4 text-sm">
            Nothing to set yet.
          </TabsContent>
        </Tabs>
      </Specimen>

      <Specimen name="ToggleGroup" note="Toggles that know about each other.">
        <ToggleGroup type="single" defaultValue="week" variant="outline">
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="multiple" variant="outline">
          <ToggleGroupItem value="bold">B</ToggleGroupItem>
          <ToggleGroupItem value="italic">I</ToggleGroupItem>
          <ToggleGroupItem value="underline">U</ToggleGroupItem>
        </ToggleGroup>
      </Specimen>

      <Specimen name="Tooltip" note="The name of a control that shows only an icon.">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Notifications">
              <BellIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Search">
              <SearchIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Search</TooltipContent>
        </Tooltip>
      </Specimen>

      <Specimen name="Skeleton in place" note="What a card looks like while it loads — the atoms above, composed.">
        <Card className="w-80">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-20" />
          </CardFooter>
        </Card>
      </Specimen>

      <Separator className="my-2" />
      <p className="text-muted-foreground py-6 text-sm">
        Not shown above, because each needs a host that gives it data or a route of its own:{" "}
        <code className="font-mono text-xs">chart</code>, <code className="font-mono text-xs">combobox</code>,{" "}
        <code className="font-mono text-xs">message-scroller</code>,{" "}
        <code className="font-mono text-xs">questionnaire</code>, <code className="font-mono text-xs">direction</code>.
        All five are installed.
      </p>
    </Reading>
  );
}
