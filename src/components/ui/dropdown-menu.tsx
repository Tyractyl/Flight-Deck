'use client';

import * as React from 'react';
import { Menu } from '@base-ui/react';
import { cn } from '../../utils/cn';

/* ────────────────────────────────────────────────────────────────
 *  Dropdown Menu — Base UI implementation
 *  Keeps the same export names/props as the old Radix version so
 *  consumers don't need to change.
 * ──────────────────────────────────────────────────────────────── */

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof Menu.Root>) {
  return <Menu.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof Menu.Portal>) {
  return <Menu.Portal data-slot="dropdown-menu-portal" {...props} />;
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLElement,
  React.ComponentProps<typeof Menu.Trigger> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
  return (
    <Menu.Trigger
      ref={ref}
      data-slot="dropdown-menu-trigger"
      {...props}
      render={asChild ? (children as React.ReactElement) : undefined}
    >
      {!asChild ? children : null}
    </Menu.Trigger>
  );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Menu.Popup> &
    Pick<React.ComponentProps<typeof Menu.Positioner>, 'sideOffset' | 'side' | 'align' | 'alignOffset'>
>(({ className, sideOffset = 4, side, align, alignOffset, ...props }, ref) => {
  return (
    <Menu.Portal>
      <Menu.Positioner
        sideOffset={sideOffset}
        side={side}
        align={align}
        alignOffset={alignOffset}
        style={{ zIndex: 9999 }}
      >
        <Menu.Popup
          ref={ref}
          data-slot="dropdown-menu-content"
          className={cn(
            'bg-[var(--bg-card)] text-[var(--fg)] z-[9999] max-h-(--available-height) min-w-[8rem] overflow-hidden rounded-xl border border-[var(--border-strong)] p-1 shadow-2xl backdrop-blur-md',
            'transition-all duration-[420ms] ease-[var(--sileo-spring-easing)] origin-top',
            'data-[starting-style]:scale-[0.96] data-[starting-style]:-translate-y-2 data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-[0.96] data-[ending-style]:-translate-y-2 data-[ending-style]:opacity-0',
            className,
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof Menu.Group>) {
  return <Menu.Group data-slot="dropdown-menu-group" {...props} />;
}

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Menu.Item> & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
    asChild?: boolean;
  }
>(({ className, inset, variant = 'default', asChild, children, ...props }, ref) => {
  return (
    <Menu.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "text-[var(--fg-secondary)] data-[highlighted]:text-[var(--fg)] data-[variant=destructive]:text-[#ff4444] data-[variant=destructive]:data-[highlighted]:text-[#ff4444] relative z-10 flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 transition-colors duration-200 active:scale-95",
        className,
      )}
      render={asChild ? (children as React.ReactElement) : undefined}
      {...props}
    >
      {!asChild ? children : null}
    </Menu.Item>
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Menu.CheckboxItem> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  return (
    <Menu.CheckboxItem
      ref={ref}
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "group data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      render={asChild ? (children as React.ReactElement) : undefined}
      {...props}
    >
      {!asChild ? (
        <>
          <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
            <span className="hidden group-data-[checked]:block">✓</span>
          </span>
          {children}
        </>
      ) : null}
    </Menu.CheckboxItem>
  );
});
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof Menu.RadioGroup>) {
  return (
    <Menu.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
  );
}

const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Menu.RadioItem> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  return (
    <Menu.RadioItem
      ref={ref}
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "group data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      render={asChild ? (children as React.ReactElement) : undefined}
      {...props}
    >
      {!asChild ? (
        <>
          <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
            <span className="hidden size-2 rounded-full bg-current group-data-[checked]:block" />
          </span>
          {children}
        </>
      ) : null}
    </Menu.RadioItem>
  );
});
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Menu.GroupLabel> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => {
  return (
    <Menu.Group>
      <Menu.GroupLabel
        ref={ref}
        data-slot="dropdown-menu-label"
        data-inset={inset}
        className={cn('px-2 py-1.5 text-sm font-medium data-[inset]:pl-8', className)}
        {...props}
      />
    </Menu.Group>
  );
});
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Menu.Separator>
>(({ className, ...props }, ref) => {
  return (
    <Menu.Separator
      ref={ref}
      data-slot="dropdown-menu-separator"
      className={cn('bg-[var(--border)] -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
});
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'text-muted-foreground ml-auto text-xs tracking-widest',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof Menu.SubmenuRoot>) {
  return <Menu.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Menu.SubmenuTrigger> & {
    inset?: boolean;
    asChild?: boolean;
  }
>(({ className, inset, asChild, children, ...props }, ref) => {
  return (
    <Menu.SubmenuTrigger
      ref={ref}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=open]:bg-accent flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8',
        className,
      )}
      render={asChild ? (children as React.ReactElement) : undefined}
      {...props}
    >
      {!asChild ? (
        <>
          {children}
          <span className="ml-auto size-4">›</span>
        </>
      ) : null}
    </Menu.SubmenuTrigger>
  );
});
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Menu.Popup> &
    Pick<React.ComponentProps<typeof Menu.Positioner>, 'sideOffset' | 'side' | 'align' | 'alignOffset'>
>(({ className, sideOffset = 4, side, align, alignOffset, ...props }, ref) => {
  return (
    <Menu.Portal>
      <Menu.Positioner
        sideOffset={sideOffset}
        side={side}
        align={align}
        alignOffset={alignOffset}
        style={{ zIndex: 9999 }}
      >
        <Menu.Popup
          ref={ref}
          data-slot="dropdown-menu-sub-content"
          className={cn(
            'bg-[var(--bg-card)] text-[var(--fg)] z-[9999] min-w-[8rem] overflow-hidden rounded-xl border border-[var(--border-strong)] p-1 shadow-2xl backdrop-blur-md',
            'transition-all duration-[420ms] ease-[var(--sileo-spring-easing)] origin-top',
            'data-[starting-style]:scale-[0.96] data-[starting-style]:-translate-y-2 data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-[0.96] data-[ending-style]:-translate-y-2 data-[ending-style]:opacity-0',
            className,
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  );
});
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
