"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "overflow-hidden rounded-md border border-white/[0.06] bg-white/[0.02] transition-colors data-[state=open]:border-white/[0.12] data-[state=open]:bg-white/[0.04]",
      className,
    )}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "group flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-ink-primary outline-none transition-colors hover:bg-white/[0.04]",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden text-sm text-ink-secondary transition-all data-[state=closed]:animate-[acc-up_220ms_ease-out] data-[state=open]:animate-[acc-down_240ms_ease-out]",
    )}
    {...props}
    style={{
      ...props.style,
    }}
  >
    <style jsx global>{`
      @keyframes acc-down {
        from {
          height: 0;
          opacity: 0;
        }
        to {
          height: var(--radix-accordion-content-height);
          opacity: 1;
        }
      }
      @keyframes acc-up {
        from {
          height: var(--radix-accordion-content-height);
          opacity: 1;
        }
        to {
          height: 0;
          opacity: 0;
        }
      }
    `}</style>
    <div className={cn("px-4 pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = "AccordionContent";
