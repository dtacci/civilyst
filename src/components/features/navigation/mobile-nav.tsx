'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  Mic,
  Home,
  Map,
  PlusCircle,
  User,
  Settings,
  Zap,
  Bell,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '~/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
}

interface MobileNavProps {
  className?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onVoiceSearch?: (query: string) => void;
  onSearch?: (query: string) => void;
  notifications?: number;
}

const primaryNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Campaigns', href: '/campaigns', icon: Map },
  { label: 'Create', href: '/campaigns/create', icon: PlusCircle },
  { label: 'Profile', href: '/profile', icon: User },
];

const secondaryNavItems: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help', href: '/help', icon: Zap },
];

export function MobileNav({
  className,
  user,
  onVoiceSearch,
  onSearch,
  notifications = 0,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isVoiceActive, setIsVoiceActive] = React.useState(false);
  const pathname = usePathname();

  // Close nav when route changes
  React.useEffect(() => {
    setIsOpen(false);
    setIsSearchExpanded(false);
  }, [pathname]);

  // Close nav when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && !target.closest('[data-mobile-nav]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when nav is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSearch = (query: string) => {
    onSearch?.(query);
    setSearchQuery('');
    setIsSearchExpanded(false);
  };

  const handleVoiceSearch = () => {
    setIsVoiceActive(true);
    // Voice search integration would go here
    // For now, we'll simulate it
    setTimeout(() => {
      setIsVoiceActive(false);
      const mockQuery = 'Find campaigns near me';
      setSearchQuery(mockQuery);
      onVoiceSearch?.(mockQuery);
    }, 2000);
  };

  const isActivePath = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <header
        className={cn(
          'sticky top-0 z-50 w-full',
          'bg-[--color-surface-elevated] backdrop-blur-md bg-opacity-90',
          'border-b border-[--color-border]',
          'safe-area-inset-top',
          className
        )}
      >
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo/Brand */}
          <Link
            href="/"
            className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus] rounded-[--border-radius-md] p-1"
          >
            <div className="w-8 h-8 rounded-[--border-radius-md] bg-gradient-to-br from-[--color-primary] to-[--color-secondary] flex items-center justify-center">
              <span className="text-[--color-text-inverse] font-bold text-sm">
                C
              </span>
            </div>
            <span className="font-bold text-[--font-size-lg] text-[--color-text-primary] hidden sm:block">
              Civilyst
            </span>
          </Link>

          {/* Center - Search */}
          <div className="flex-1 max-w-md mx-4 relative">
            <div
              className={cn(
                'relative transition-all duration-[--duration-normal]',
                isSearchExpanded && 'w-full'
              )}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleSearch(searchQuery)
                }
                placeholder="Search campaigns..."
                className={cn(
                  'w-full h-9 pl-10 pr-20 rounded-[--border-radius-full]',
                  'bg-[--color-surface] border border-[--color-border]',
                  'text-[--font-size-sm] text-[--color-text-primary]',
                  'placeholder:text-[--color-text-tertiary]',
                  'focus:outline-none focus:ring-2 focus:ring-[--color-border-focus]',
                  'transition-all duration-[--duration-normal]',
                  !isSearchExpanded && 'hidden sm:block'
                )}
              />

              {/* Search Icon */}
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[--color-text-tertiary]" />

              {/* Voice Button */}
              <Button
                onClick={handleVoiceSearch}
                disabled={isVoiceActive}
                variant="ghost"
                size="icon"
                className={cn(
                  'absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7',
                  isVoiceActive && 'animate-pulse text-[--color-accent]',
                  !isSearchExpanded && 'hidden sm:flex'
                )}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Search Toggle */}
            <Button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              variant="ghost"
              size="icon"
              className="sm:hidden h-9 w-9"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Right Side - Notifications & Menu */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-[--border-radius-full] bg-[--color-danger] text-[--color-text-inverse] text-[--font-size-xs] font-medium flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Button>

            {/* Menu Toggle */}
            <Button
              onClick={() => setIsOpen(!isOpen)}
              variant="ghost"
              size="icon"
              className="h-9 w-9 lg:hidden"
              data-mobile-nav
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Search Bar (Mobile) */}
        {isSearchExpanded && (
          <div className="px-4 pb-4 sm:hidden">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleSearch(searchQuery)
                }
                placeholder="Search campaigns..."
                className="w-full h-11 pl-12 pr-16 rounded-[--border-radius-full] bg-[--color-surface] border border-[--color-border] text-[--font-size-base] text-[--color-text-primary] placeholder:text-[--color-text-tertiary] focus:outline-none focus:ring-2 focus:ring-[--color-border-focus]"
                autoFocus
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[--color-text-tertiary]" />
              <Button
                onClick={handleVoiceSearch}
                disabled={isVoiceActive}
                variant="ghost"
                size="icon"
                className={cn(
                  'absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7',
                  isVoiceActive && 'animate-pulse text-[--color-accent]'
                )}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-[--duration-normal]"
            onClick={() => setIsOpen(false)}
          />

          {/* Navigation Panel */}
          <div
            className={cn(
              'absolute right-0 top-0 h-full w-80 max-w-[80vw]',
              'bg-[--color-surface-elevated] shadow-[--shadow-modal]',
              'transform transition-transform duration-[--duration-normal]',
              'safe-area-inset-right safe-area-inset-top',
              'flex flex-col'
            )}
            data-mobile-nav
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[--color-border]">
              <h2 className="text-[--font-size-lg] font-semibold text-[--color-text-primary]">
                Menu
              </h2>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* User Profile */}
            {user && (
              <div className="p-6 border-b border-[--color-border]">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-[--border-radius-full] bg-[--color-primary] flex items-center justify-center">
                    <span className="text-[--color-text-inverse] font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[--font-size-base] font-medium text-[--color-text-primary] truncate">
                      {user.name}
                    </p>
                    <p className="text-[--font-size-sm] text-[--color-text-tertiary] truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 p-6 space-y-2">
              {/* Primary Navigation */}
              <div className="space-y-1">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-3 px-4 py-3 rounded-[--border-radius-lg]',
                        'transition-colors duration-[--duration-normal]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]',
                        'touch-manipulation',
                        isActive
                          ? 'bg-[--color-primary-light] text-[--color-primary] font-medium'
                          : 'text-[--color-text-secondary] hover:bg-[--color-surface] hover:text-[--color-text-primary]'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-[--font-size-base]">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="ml-auto bg-[--color-danger] text-[--color-text-inverse] text-[--font-size-xs] font-medium px-2 py-1 rounded-[--border-radius-full]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-[--color-border]" />

              {/* Secondary Navigation */}
              <div className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-3 px-4 py-3 rounded-[--border-radius-lg]',
                        'transition-colors duration-[--duration-normal]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]',
                        'touch-manipulation',
                        isActive
                          ? 'bg-[--color-primary-light] text-[--color-primary] font-medium'
                          : 'text-[--color-text-secondary] hover:bg-[--color-surface] hover:text-[--color-text-primary]'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-[--font-size-base]">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-inset-bottom">
        <div className="bg-[--color-surface-elevated] backdrop-blur-md bg-opacity-90 border-t border-[--color-border]">
          <div className="flex">
            {primaryNavItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center py-2 px-1',
                    'min-h-[--space-touch-target] transition-colors duration-[--duration-normal]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]',
                    'touch-manipulation',
                    isActive
                      ? 'text-[--color-primary]'
                      : 'text-[--color-text-tertiary] hover:text-[--color-text-primary]'
                  )}
                >
                  <Icon className="h-6 w-6 mb-1" />
                  <span className="text-[--font-size-xs] font-medium">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-[--color-primary] rounded-t-[--border-radius-full]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileNav;
