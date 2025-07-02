import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "~/lib/utils"

// Mobile-first card variants with animations and touch feedback
const cardVariants = cva(
  [
    // Base styles - mobile-first design
    "relative overflow-hidden rounded-[--border-radius-lg] bg-[--color-surface-elevated]",
    "border border-[--color-border] transition-all duration-[--duration-normal]",
    "shadow-[--shadow-touch]",
    
    // Mobile touch optimizations
    "touch-manipulation select-none",
    
    // Smooth animations
    "hover:shadow-[--shadow-elevated] hover:-translate-y-1",
    "focus-within:ring-2 focus-within:ring-[--color-border-focus] focus-within:ring-offset-2",
    
    // Active state for touch feedback
    "active:scale-[0.99] active:transition-transform active:duration-[--duration-fast]",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-[--color-surface-elevated] border-[--color-border]",
        ],
        elevated: [
          "bg-[--color-surface-elevated] border-[--color-border]",
          "shadow-[--shadow-elevated]",
          "hover:shadow-[--shadow-modal]",
        ],
        outline: [
          "bg-transparent border-2 border-[--color-border]",
          "hover:border-[--color-primary] hover:bg-[--color-surface]",
        ],
        ghost: [
          "bg-transparent border-transparent",
          "hover:bg-[--color-surface] hover:border-[--color-border]",
        ],
        primary: [
          "bg-[--color-primary-light] border-[--color-primary]",
          "hover:bg-[--color-primary] hover:text-[--color-text-inverse]",
        ],
        success: [
          "bg-[--color-accent-light] border-[--color-accent]",
          "hover:bg-[--color-accent] hover:text-[--color-text-inverse]",
        ],
        warning: [
          "bg-[--color-warning-light] border-[--color-warning]",
          "hover:bg-[--color-warning] hover:text-[--color-text-inverse]",
        ],
        danger: [
          "bg-[--color-danger-light] border-[--color-danger]",
          "hover:bg-[--color-danger] hover:text-[--color-text-inverse]",
        ],
      },
      size: {
        sm: [
          "p-3 gap-2",
          "rounded-[--border-radius-md]",
        ],
        default: [
          "p-4 gap-3",
          "rounded-[--border-radius-lg]",
        ],
        lg: [
          "p-6 gap-4",
          "rounded-[--border-radius-xl]",
        ],
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:shadow-[--shadow-elevated] hover:-translate-y-1",
          "active:translate-y-0 active:shadow-[--shadow-touch]",
        ],
        false: "cursor-default",
      },
      loading: {
        true: [
          "opacity-70 cursor-not-allowed",
          "pointer-events-none",
        ],
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
      loading: false,
    },
  }
)

// Card Header component
const cardHeaderVariants = cva([
  "flex flex-col space-y-1.5 p-6",
  "border-b border-[--color-border]",
])

// Card Content component  
const cardContentVariants = cva([
  "p-6 pt-0",
])

// Card Footer component
const cardFooterVariants = cva([
  "flex items-center justify-between p-6 pt-0",
  "border-t border-[--color-border]",
  "gap-3",
])

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
  loading?: boolean
  loadingComponent?: React.ReactNode
  ripple?: boolean
}

// Main Card component
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    size, 
    interactive, 
    loading, 
    loadingComponent,
    children, 
    onClick,
    ripple = false,
    ...props 
  }, ref) => {
    const [rippleEffect, setRippleEffect] = React.useState<{ x: number; y: number; id: number } | null>(null)
    
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (loading) return
      
      // Add ripple effect for interactive cards
      if (ripple && interactive) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = Date.now()
        
        setRippleEffect({ x, y, id })
        setTimeout(() => setRippleEffect(null), 600)
      }
      
      onClick?.(e)
    }, [loading, ripple, interactive, onClick])

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size, interactive, loading }), className)}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effect */}
        {rippleEffect && (
          <span
            className="absolute pointer-events-none rounded-full bg-current opacity-30 animate-ping"
            style={{
              left: rippleEffect.x - 10,
              top: rippleEffect.y - 10,
              width: 20,
              height: 20,
            }}
          />
        )}
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-[--color-surface] bg-opacity-50 flex items-center justify-center z-10">
            {loadingComponent || (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[--color-primary] border-t-transparent" />
            )}
          </div>
        )}
        
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

// Card Header component
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants(), className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

// Card Title component
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "font-semibold leading-none tracking-tight",
        "text-[--font-size-lg] text-[--color-text-primary]",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
)
CardTitle.displayName = "CardTitle"

// Card Description component
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "text-[--font-size-sm] text-[--color-text-secondary]",
        "leading-relaxed",
        className
      )}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

// Card Content component
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(cardContentVariants(), className)} 
      {...props} 
    />
  )
)
CardContent.displayName = "CardContent"

// Card Footer component
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants(), className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  cardVariants 
} 