'use client'

import * as React from 'react'
import { Plus, X, Mic, Camera, MapPin, MessageSquare, Sparkles } from 'lucide-react'
import { Button } from './button'
import { cn } from '~/lib/utils'

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  action: () => void
  disabled?: boolean
}

interface FloatingActionButtonProps {
  className?: string
  onVoiceCapture?: () => void
  onPhotoCapture?: () => void
  onLocationCapture?: () => void
  onAIAssist?: () => void
  onQuickCreate?: () => void
  onFeedback?: () => void
  disabled?: boolean
  variant?: 'default' | 'ai-powered' | 'voice-first'
}

export function FloatingActionButton({
  className,
  onVoiceCapture,
  onPhotoCapture,
  onLocationCapture,
  onAIAssist,
  onQuickCreate,
  onFeedback,
  disabled = false,
  variant = 'default'
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)

  const quickActions: QuickAction[] = React.useMemo(() => [
    {
      id: 'voice',
      label: 'Voice Campaign',
      icon: Mic,
      color: 'text-[--color-accent] bg-[--color-accent-light]',
      action: () => {
        onVoiceCapture?.()
        setIsExpanded(false)
      },
      disabled: !onVoiceCapture
    },
    {
      id: 'photo',
      label: 'Photo Evidence',
      icon: Camera,
      color: 'text-[--color-primary] bg-[--color-primary-light]',
      action: () => {
        onPhotoCapture?.()
        setIsExpanded(false)
      },
      disabled: !onPhotoCapture
    },
    {
      id: 'location',
      label: 'Location Issue',
      icon: MapPin,
      color: 'text-[--color-warning] bg-[--color-warning-light]',
      action: () => {
        onLocationCapture?.()
        setIsExpanded(false)
      },
      disabled: !onLocationCapture
    },
    {
      id: 'ai-assist',
      label: 'AI Assistant',
      icon: Sparkles,
      color: 'text-[--color-secondary] bg-[--color-secondary-light]',
      action: () => {
        onAIAssist?.()
        setIsExpanded(false)
      },
      disabled: !onAIAssist
    },
    {
      id: 'feedback',
      label: 'Quick Feedback',
      icon: MessageSquare,
      color: 'text-[--color-accent] bg-[--color-accent-light]',
      action: () => {
        onFeedback?.()
        setIsExpanded(false)
      },
      disabled: !onFeedback
    }
  ], [onVoiceCapture, onPhotoCapture, onLocationCapture, onAIAssist, onFeedback])

  const handleToggle = () => {
    if (disabled) return
    
    setIsAnimating(true)
    setIsExpanded(!isExpanded)
    
    // Reset animation state
    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleQuickCreate = () => {
    onQuickCreate?.()
  }

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isExpanded && !target.closest('[data-fab]')) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isExpanded])

  const getMainButtonVariant = () => {
    switch (variant) {
      case 'ai-powered':
        return 'bg-gradient-to-r from-[--color-primary] to-[--color-secondary] text-[--color-text-inverse] shadow-[--shadow-elevated] hover:shadow-[--shadow-modal]'
      case 'voice-first':
        return 'bg-gradient-to-r from-[--color-accent] to-[--color-primary] text-[--color-text-inverse] shadow-[--shadow-elevated] hover:shadow-[--shadow-modal]'
      default:
        return 'bg-[--color-primary] text-[--color-text-inverse] shadow-[--shadow-elevated] hover:shadow-[--shadow-modal]'
    }
  }

  const getMainIcon = () => {
    switch (variant) {
      case 'ai-powered':
        return Sparkles
      case 'voice-first':
        return Mic
      default:
        return isExpanded ? X : Plus
    }
  }

  const MainIcon = getMainIcon()

  return (
    <div 
      className={cn(
        "fixed z-50 flex flex-col-reverse items-end",
        "bottom-20 right-4 sm:bottom-6 sm:right-6", // Account for bottom nav on mobile
        "safe-area-inset-bottom safe-area-inset-right",
        className
      )}
      data-fab
    >
      {/* Quick Actions */}
      {isExpanded && (
        <div className="flex flex-col gap-3 mb-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            
            return (
              <div
                key={action.id}
                className={cn(
                  "transform transition-all duration-[--duration-normal]",
                  "animate-in slide-in-from-bottom-2 fade-in",
                  isAnimating && "animate-out slide-out-to-bottom-2 fade-out"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Action Label */}
                  <div className={cn(
                    "px-3 py-2 rounded-[--border-radius-lg]",
                    "bg-[--color-surface-elevated] border border-[--color-border]",
                    "shadow-[--shadow-touch] backdrop-blur-sm",
                    "text-[--font-size-sm] font-medium text-[--color-text-primary]",
                    "whitespace-nowrap max-w-xs",
                    "opacity-0 animate-in fade-in slide-in-from-right-4",
                    "transform transition-all duration-[--duration-normal]"
                  )}
                  style={{
                    animationDelay: `${index * 50 + 100}ms`,
                    animationFillMode: 'forwards'
                  }}
                  >
                    {action.label}
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={action.action}
                    disabled={action.disabled || disabled}
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-[--border-radius-full]",
                      "shadow-[--shadow-elevated] hover:shadow-[--shadow-modal]",
                      "transform transition-all duration-[--duration-normal]",
                      "hover:scale-110 active:scale-95",
                      "border-2 border-white",
                      action.color,
                      action.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={variant === 'default' ? handleToggle : (variant === 'voice-first' ? onVoiceCapture : onAIAssist)}
        disabled={disabled}
        className={cn(
          "h-14 w-14 rounded-[--border-radius-full]",
          "transform transition-all duration-[--duration-normal]",
          "hover:scale-110 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[--color-border-focus]",
          "touch-manipulation",
          getMainButtonVariant(),
          disabled && "opacity-50 cursor-not-allowed scale-90",
          isExpanded && variant === 'default' && "rotate-45"
        )}
      >
        <MainIcon className={cn(
          "h-6 w-6 transition-transform duration-[--duration-normal]",
          variant === 'ai-powered' && "animate-pulse"
        )} />
      </Button>

      {/* Secondary Action Button (for variants) */}
      {variant !== 'default' && (
        <Button
          onClick={handleQuickCreate}
          disabled={disabled}
          size="icon"
          className={cn(
            "h-10 w-10 rounded-[--border-radius-full] mt-3",
            "bg-[--color-surface-elevated] border-2 border-[--color-border]",
            "text-[--color-text-primary] shadow-[--shadow-touch]",
            "hover:shadow-[--shadow-elevated] hover:scale-105",
            "transform transition-all duration-[--duration-normal]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}

      {/* Backdrop for expanded state */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}

// Preset configurations for common use cases
export function VoiceFirstFAB(props: Omit<FloatingActionButtonProps, 'variant'>) {
  return <FloatingActionButton {...props} variant="voice-first" />
}

export function AIPoweredFAB(props: Omit<FloatingActionButtonProps, 'variant'>) {
  return <FloatingActionButton {...props} variant="ai-powered" />
}

export default FloatingActionButton 