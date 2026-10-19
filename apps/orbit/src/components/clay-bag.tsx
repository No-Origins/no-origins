"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Backpack, Package } from "lucide-react";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent } from "@no-origins/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@no-origins/ui/components/dialog";
import { Empty, EmptyHeader, EmptyMedia } from "@no-origins/ui/components/empty";
import { ScrollArea } from "@no-origins/ui/components/scroll-area";
import { Text } from "@no-origins/ui/components/text";
import { readInventory, serverInventory, subscribeInventory } from "@/world/clay-inventory";
import { sendClayInput, OPEN_CLAY_BAG } from "@/world/clay-input";

export function ClayBag() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useSyncExternalStore(subscribeInventory, readInventory, serverInventory);
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const changeOpen = (value: boolean) => {
    sendClayInput({ action: "bag", open: value });
    setOpen(value);
  };
  useEffect(() => {
    const show = () => { sendClayInput({ action: "bag", open: true }); setOpen(true); };
    window.addEventListener(OPEN_CLAY_BAG, show);
    return () => { window.removeEventListener(OPEN_CLAY_BAG, show); sendClayInput({ action: "bag", open: false }); };
  }, []);
  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild>
      <Button ref={trigger} variant="ghost" size="icon" className="size-full" title="Clay’s bag" aria-label={`Open Clay’s bag, ${count} items`}><Backpack className="size-5" /></Button>
    </DialogTrigger>
    <DialogContent className="max-h-[calc(100dvh-32px)]" onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
      <DialogHeader className="pe-12">
        <DialogTitle asChild><Text role="heading">Clay’s bag</Text></DialogTitle>
        <DialogDescription asChild><Text role="caption">Things Clay carries from place to place.</Text></DialogDescription>
      </DialogHeader>
      {items.length === 0 ? <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><Backpack aria-hidden="true" /></EmptyMedia>
          <Text role="heading" align="center">Nothing here yet</Text>
          <Text tone="muted" align="center">Items Clay collects along the way will appear here.</Text>
        </EmptyHeader>
      </Empty> : <ScrollArea className="h-[min(50dvh,384px)]">
        <div className="flex flex-col gap-stack-tight" role="list" aria-label="Bag items">
          {items.map(item => <Card key={item.id} size="sm" role="listitem"><CardContent className="flex items-start gap-inline">
            <Package className="size-5 shrink-0" aria-hidden="true" />
            <div className="flex min-w-0 flex-1 flex-col gap-stack-tight">
              <Text>{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</Text>
              <Text role="caption">{item.description}</Text>
              <Text role="caption">Found in {item.zone}</Text>
            </div>
          </CardContent></Card>)}
        </div>
      </ScrollArea>}
      <Text role="caption">{count} {count === 1 ? "item" : "items"}</Text>
    </DialogContent>
  </Dialog>;
}
