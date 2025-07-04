'use client';

import { useState, useCallback } from 'react';
import {
  Share2,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  MessageCircle,
  Download,
  QrCode,
  Users,
  TrendingUp,
  Zap,
  CheckCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { cn } from '~/lib/utils';

export interface SocialShareData {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  tags?: string[];
  location?: string;
  voteCount?: number;
  creatorName?: string;
}

export interface SocialShareProps {
  data: SocialShareData;
  variant?: 'default' | 'compact' | 'floating' | 'embedded';
  showQR?: boolean;
  showAnalytics?: boolean;
  className?: string;
  onShare?: (platform: string) => void;
}

interface SharePlatform {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  shareUrl: (data: SocialShareData) => string;
  description: string;
}

const SHARE_PLATFORMS: SharePlatform[] = [
  {
    key: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-[#1DA1F2] hover:bg-[#1a91da]',
    description: 'Share on Twitter',
    shareUrl: (data) => {
      const text = `🗳️ ${data.title} - Join this civic engagement campaign${data.location ? ` in ${data.location}` : ''}! ${data.tags ? data.tags.map((tag) => `#${tag}`).join(' ') : '#CivicEngagement #CommunityVoice'}`;
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.url)}`;
    },
  },
  {
    key: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-[#4267B2] hover:bg-[#365899]',
    description: 'Share on Facebook',
    shareUrl: (data) => {
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}&quote=${encodeURIComponent(`Join "${data.title}" - ${data.description.slice(0, 100)}...`)}`;
    },
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-[#0077B5] hover:bg-[#005885]',
    description: 'Share on LinkedIn',
    shareUrl: (data) => {
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}&title=${encodeURIComponent(data.title)}&summary=${encodeURIComponent(data.description.slice(0, 200))}`;
    },
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-[#25D366] hover:bg-[#20ba5a]',
    description: 'Share on WhatsApp',
    shareUrl: (data) => {
      const text = `🗳️ ${data.title}\n\n${data.description.slice(0, 150)}...\n\nJoin the conversation: ${data.url}`;
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
    },
  },
  {
    key: 'email',
    name: 'Email',
    icon: Mail,
    color: 'bg-[--color-secondary] hover:bg-[--color-secondary]/80',
    description: 'Share via email',
    shareUrl: (data) => {
      const subject = `Join "${data.title}" - Civic Engagement Campaign`;
      const body = `Hi!\n\nI wanted to share this important civic engagement campaign with you:\n\n"${data.title}"\n\n${data.description}\n\n${data.location ? `Location: ${data.location}\n` : ''}${data.voteCount ? `Current support: ${data.voteCount} voices\n` : ''}\nJoin the conversation and make your voice heard: ${data.url}\n\nTogether, we can make a difference in our community!\n\nBest regards`;
      return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    },
  },
];

export function SocialShare({
  data,
  variant = 'default',
  showQR = true,
  showAnalytics = true,
  className,
  onShare,
}: SocialShareProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);

  // Generate enhanced sharing URL with tracking
  const enhancedUrl = `${data.url}?share=social&ref=${data.id}`;

  const handleNativeShare = useCallback(async () => {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({
          title: data.title,
          text: `Join "${data.title}" - ${data.description.slice(0, 100)}...`,
          url: enhancedUrl,
        });
        onShare?.('native');
        setShareCount((prev) => prev + 1);
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', err);
      }
    }
  }, [data, enhancedUrl, onShare]);

  const handlePlatformShare = useCallback(
    (platform: SharePlatform) => {
      window.open(platform.shareUrl(data), '_blank', 'width=600,height=400');
      onShare?.(platform.key);
      setShareCount((prev) => prev + 1);
    },
    [data, onShare]
  );

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(enhancedUrl);
      setCopiedUrl(true);
      onShare?.('copy');
      setShareCount((prev) => prev + 1);
      setTimeout(() => setCopiedUrl(false), 3000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }, [enhancedUrl, onShare]);

  const generateSocialImage = useCallback(() => {
    // In a real implementation, this would generate a dynamic social media card
    // For now, we'll use a placeholder that could integrate with a service like Bannerbear
    const socialImageUrl = `https://og-image-generator.vercel.app/**${encodeURIComponent(data.title)}**%0A${encodeURIComponent(data.description.slice(0, 80))}...?theme=dark&md=1&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-white.svg`;
    return socialImageUrl;
  }, [data]);

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNativeShare}
          className="text-[--color-text-secondary] hover:text-[--color-primary]"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyUrl}
          className="text-[--color-text-secondary] hover:text-[--color-primary]"
        >
          {copiedUrl ? (
            <CheckCircle className="h-4 w-4 text-[--color-success]" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        {showAnalytics && shareCount > 0 && (
          <span className="text-xs text-[--color-text-tertiary]">
            {shareCount} shares
          </span>
        )}
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div
        className={cn(
          'fixed bottom-20 right-4 z-[--z-fab] transition-all duration-300',
          isExpanded ? 'space-y-2' : '',
          className
        )}
      >
        {isExpanded && (
          <div className="flex flex-col gap-2 mb-2">
            {SHARE_PLATFORMS.slice(0, 4).map((platform) => (
              <Button
                key={platform.key}
                size="icon"
                onClick={() => handlePlatformShare(platform)}
                className={cn(
                  'h-12 w-12 rounded-full shadow-lg transition-all duration-200',
                  'animate-scale-in',
                  platform.color,
                  'text-white border-0'
                )}
                style={{
                  animationDelay: `${SHARE_PLATFORMS.indexOf(platform) * 50}ms`,
                }}
              >
                <platform.icon className="h-5 w-5" />
              </Button>
            ))}
          </div>
        )}
        <Button
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'h-14 w-14 rounded-full shadow-xl transition-all duration-300',
            'bg-gradient-to-r from-[--color-primary] to-[--color-accent]',
            'hover:shadow-2xl hover:scale-110',
            'text-white border-0',
            isExpanded && 'rotate-45'
          )}
        >
          <Share2 className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[--color-primary]/5 to-[--color-accent]/5 border-b border-[--color-border]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[--color-primary]/10 rounded-lg">
                <Share2 className="h-5 w-5 text-[--color-primary]" />
              </div>
              <div>
                <h3 className="font-semibold text-[--color-text-primary]">
                  Share Campaign
                </h3>
                <p className="text-sm text-[--color-text-secondary]">
                  Help spread the word and grow support
                </p>
              </div>
            </div>
            {showAnalytics && (
              <div className="text-center">
                <div className="text-lg font-bold text-[--color-primary]">
                  {shareCount}
                </div>
                <div className="text-xs text-[--color-text-tertiary]">
                  shares
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 space-y-4">
          {/* Native Share & Copy */}
          <div className="flex gap-3">
            {typeof navigator !== 'undefined' &&
              typeof navigator.share === 'function' && (
                <Button
                  onClick={handleNativeShare}
                  className="flex-1 bg-gradient-to-r from-[--color-primary] to-[--color-accent] hover:opacity-90 text-white border-0"
                  size="lg"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </Button>
              )}
            <Button
              onClick={handleCopyUrl}
              variant={copiedUrl ? 'default' : 'outline'}
              size="lg"
              className={cn(
                'flex-1 transition-all duration-200',
                copiedUrl &&
                  'bg-[--color-success] text-white border-[--color-success]'
              )}
            >
              {copiedUrl ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>

          {/* Platform-Specific Sharing */}
          <div>
            <h4 className="text-sm font-medium text-[--color-text-primary] mb-3">
              Share on social platforms
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SHARE_PLATFORMS.map((platform) => (
                <Button
                  key={platform.key}
                  onClick={() => handlePlatformShare(platform)}
                  variant="outline"
                  className={cn(
                    'h-auto p-3 flex flex-col items-center gap-2',
                    'hover:border-[--color-primary] hover:text-[--color-primary]',
                    'transition-all duration-200 hover:scale-105'
                  )}
                >
                  <platform.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{platform.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[--color-border]">
            {showQR && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQRCode(!showQRCode)}
                className="text-[--color-text-secondary] hover:text-[--color-primary]"
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const imageUrl = generateSocialImage();
                window.open(imageUrl, '_blank');
              }}
              className="text-[--color-text-secondary] hover:text-[--color-primary]"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Social Image
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[--color-text-secondary] hover:text-[--color-primary]"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>

          {/* QR Code Section */}
          {showQRCode && (
            <div className="mt-4 p-4 bg-[--color-surface] rounded-lg border border-[--color-border]">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-white border border-[--color-border] rounded-lg flex items-center justify-center mb-3">
                  <QrCode className="h-16 w-16 text-[--color-text-tertiary]" />
                </div>
                <p className="text-sm text-[--color-text-secondary] mb-3">
                  QR code for easy mobile sharing
                </p>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
              </div>
            </div>
          )}

          {/* Engagement Stats */}
          {showAnalytics && (
            <div className="bg-[--color-surface] rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[--color-primary]" />
                  <span className="text-[--color-text-secondary]">
                    {data.voteCount || 0} supporters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[--color-accent]" />
                  <span className="text-[--color-text-secondary]">
                    {shareCount} shares
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// CSS for animations (to be added to globals.css)
export const SOCIAL_SHARE_STYLES = `
@keyframes scale-in {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out forwards;
}
`;
