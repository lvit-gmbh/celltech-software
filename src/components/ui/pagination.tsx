import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
  onClick?: () => void
  disabled?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  onClick,
  disabled,
  children,
  ...props
}: PaginationLinkProps & { children?: React.ReactNode }) => {
  const baseClassName = cn(
    buttonVariants({
      variant: isActive ? "default" : "ghost",
      size,
    }),
    "transition-all duration-200 ease-in-out border-none",
    isActive
      ? "font-medium bg-primary text-primary-foreground hover:-translate-y-1 active:translate-y-0"
      : "hover:scale-105 hover:-translate-y-1 hover:bg-accent/80 active:scale-95 active:translate-y-0",
    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
    className
  )

  if (onClick) {
    return (
      <button
        type="button"
        aria-current={isActive ? "page" : undefined}
        className={baseClassName}
        onClick={onClick}
        disabled={disabled}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    )
  }

  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={baseClassName}
      {...props}
    >
      {children}
    </a>
  )
}
PaginationLink.displayName = "PaginationLink"

type PaginationPreviousProps = {
  onClick?: () => void
  disabled?: boolean
  className?: string
  "aria-disabled"?: boolean
}

const PaginationPrevious = ({
  className,
  onClick,
  disabled,
  "aria-disabled": ariaDisabled,
  ...props
}: PaginationPreviousProps) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="icon"
    onClick={onClick}
    disabled={disabled || ariaDisabled}
    className={cn(
      "transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 active:translate-y-0",
      className
    )}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

type PaginationNextProps = {
  onClick?: () => void
  disabled?: boolean
  className?: string
  "aria-disabled"?: boolean
}

const PaginationNext = ({
  className,
  onClick,
  disabled,
  "aria-disabled": ariaDisabled,
  ...props
}: PaginationNextProps) => (
  <PaginationLink
    aria-label="Go to next page"
    size="icon"
    onClick={onClick}
    disabled={disabled || ariaDisabled}
    className={cn(
      "transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 active:translate-y-0",
      className
    )}
    {...props}
  >
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
