'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { cn } from '~/lib/utils';
import { api } from '~/lib/trpc';
import { toast } from '~/lib/toast';
import { PortfolioType } from '~/generated/prisma';
import {
  ExternalLink,
  File,
  Award,
  FolderOpen,
  MessageCircle,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  fileUrl?: string;
  type: PortfolioType;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationNotes?: string;
  createdAt: Date;
}

interface PortfolioCardProps {
  item: PortfolioItem;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function PortfolioCard({
  item,
  canEdit = false,
  onEdit,
  onDelete,
  className,
}: PortfolioCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const { mutate: deletePortfolio } =
    api.verification.deletePortfolioItem.useMutation({
      onSuccess: () => {
        toast.success('Portfolio item deleted successfully');
        onDelete?.();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete portfolio item');
      },
      onSettled: () => {
        setIsDeleting(false);
      },
    });

  const handleDelete = () => {
    setIsDeleting(true);
    deletePortfolio({ portfolioId: item.id });
  };

  const getTypeIcon = (type: PortfolioType) => {
    switch (type) {
      case PortfolioType.LINK:
        return <ExternalLink className="w-4 h-4" />;
      case PortfolioType.FILE:
        return <File className="w-4 h-4" />;
      case PortfolioType.CERTIFICATE:
        return <Award className="w-4 h-4" />;
      case PortfolioType.PROJECT:
        return <FolderOpen className="w-4 h-4" />;
      case PortfolioType.TESTIMONIAL:
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: PortfolioType) => {
    switch (type) {
      case PortfolioType.LINK:
        return 'Link';
      case PortfolioType.FILE:
        return 'File';
      case PortfolioType.CERTIFICATE:
        return 'Certificate';
      case PortfolioType.PROJECT:
        return 'Project';
      case PortfolioType.TESTIMONIAL:
        return 'Testimonial';
      default:
        return 'Unknown';
    }
  };

  const getTypeColor = (type: PortfolioType) => {
    switch (type) {
      case PortfolioType.LINK:
        return 'bg-blue-100 text-blue-800';
      case PortfolioType.FILE:
        return 'bg-gray-100 text-gray-800';
      case PortfolioType.CERTIFICATE:
        return 'bg-yellow-100 text-yellow-800';
      case PortfolioType.PROJECT:
        return 'bg-purple-100 text-purple-800';
      case PortfolioType.TESTIMONIAL:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            {getTypeIcon(item.type)}
            <h3 className="font-medium text-[--color-text-primary]">
              {item.title}
            </h3>
            <Badge className={cn('text-xs', getTypeColor(item.type))}>
              {getTypeLabel(item.type)}
            </Badge>
            {item.isVerified && (
              <Badge variant="secondary" className="text-xs">
                Verified
              </Badge>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-[--color-text-secondary] mb-3">
              {item.description}
            </p>
          )}

          {/* URL/File Link */}
          {(item.url || item.fileUrl) && (
            <div className="mb-3">
              <a
                href={item.url || item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[--color-primary] hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                {item.url ? 'View Link' : 'Download File'}
              </a>
            </div>
          )}

          {/* Verification Info */}
          {item.isVerified && item.verifiedAt && (
            <div className="text-xs text-[--color-text-secondary] mb-2">
              Verified on {new Date(item.verifiedAt).toLocaleDateString()}
              {item.verificationNotes && (
                <div className="mt-1 italic">
                  &ldquo;{item.verificationNotes}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div className="text-xs text-[--color-text-secondary]">
            Added {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex gap-1 ml-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

interface AddPortfolioDialogProps {
  userSkillId: string;
  skillName: string;
  onPortfolioAdded?: () => void;
  children: React.ReactNode;
}

export function AddPortfolioDialog({
  userSkillId,
  skillName,
  onPortfolioAdded,
  children,
}: AddPortfolioDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [type, setType] = useState<PortfolioType>(PortfolioType.LINK);

  const { mutate: createPortfolio, isPending: isLoading } =
    api.verification.createPortfolioItem.useMutation({
      onSuccess: () => {
        toast.success('Portfolio item added successfully');
        setIsOpen(false);
        resetForm();
        onPortfolioAdded?.();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to add portfolio item');
      },
    });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setUrl('');
    setFileUrl('');
    setType(PortfolioType.LINK);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (type === PortfolioType.LINK && !url.trim()) {
      toast.error('URL is required for link portfolio items');
      return;
    }

    if (type === PortfolioType.FILE && !fileUrl.trim()) {
      toast.error('File URL is required for file portfolio items');
      return;
    }

    createPortfolio({
      userSkillId,
      title: title.trim(),
      description: description.trim() || undefined,
      url: type === PortfolioType.LINK ? url.trim() : undefined,
      fileUrl: type === PortfolioType.FILE ? fileUrl.trim() : undefined,
      type,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Portfolio Item for {skillName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Portfolio Type */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              Type *
            </label>
            <Select
              value={type}
              onValueChange={(value: PortfolioType) => setType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PortfolioType.LINK}>
                  Link - External URL (GitHub, website, etc.)
                </SelectItem>
                <SelectItem value={PortfolioType.FILE}>
                  File - Uploaded document or image
                </SelectItem>
                <SelectItem value={PortfolioType.CERTIFICATE}>
                  Certificate - Professional certification
                </SelectItem>
                <SelectItem value={PortfolioType.PROJECT}>
                  Project - Portfolio project or work sample
                </SelectItem>
                <SelectItem value={PortfolioType.TESTIMONIAL}>
                  Testimonial - Client or colleague testimonial
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., React Portfolio Website"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe this portfolio item..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-[--color-text-secondary] mt-1">
              {description.length}/500 characters
            </div>
          </div>

          {/* URL (for links) */}
          {type === PortfolioType.LINK && (
            <div>
              <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
                URL *
              </label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
          )}

          {/* File URL (for files) */}
          {type === PortfolioType.FILE && (
            <div>
              <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
                File URL *
              </label>
              <Input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="Upload file first, then paste the URL here"
                required
              />
              <div className="text-xs text-[--color-text-secondary] mt-1">
                Use the file upload feature to get a URL for your file
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Portfolio Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditPortfolioDialogProps {
  item: PortfolioItem;
  onPortfolioUpdated?: () => void;
  children: React.ReactNode;
}

export function EditPortfolioDialog({
  item,
  onPortfolioUpdated,
  children,
}: EditPortfolioDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [url, setUrl] = useState(item.url || '');
  const [fileUrl, setFileUrl] = useState(item.fileUrl || '');

  const { mutate: updatePortfolio, isPending: isLoading } =
    api.verification.updatePortfolioItem.useMutation({
      onSuccess: () => {
        toast.success('Portfolio item updated successfully');
        setIsOpen(false);
        onPortfolioUpdated?.();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update portfolio item');
      },
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    updatePortfolio({
      portfolioId: item.id,
      title: title.trim(),
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      fileUrl: fileUrl.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Portfolio Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., React Portfolio Website"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe this portfolio item..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-[--color-text-secondary] mt-1">
              {description.length}/500 characters
            </div>
          </div>

          {/* URL */}
          {item.type === PortfolioType.LINK && (
            <div>
              <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
                URL
              </label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}

          {/* File URL */}
          {item.type === PortfolioType.FILE && (
            <div>
              <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
                File URL
              </label>
              <Input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="Upload file first, then paste the URL here"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Portfolio Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PortfolioManagerProps {
  userSkillId: string;
  skillName: string;
  isOwner?: boolean;
  className?: string;
}

export function PortfolioManager({
  userSkillId,
  skillName,
  isOwner = false,
  className,
}: PortfolioManagerProps) {
  const {
    data: portfolioItems,
    isLoading,
    refetch,
  } = api.verification.getPortfolioByUserSkill.useQuery({
    userSkillId,
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-32" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-64" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-[--color-text-primary]">
          Portfolio ({portfolioItems?.length || 0})
        </h3>
        {isOwner && (
          <AddPortfolioDialog
            userSkillId={userSkillId}
            skillName={skillName}
            onPortfolioAdded={() => refetch()}
          >
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </AddPortfolioDialog>
        )}
      </div>

      {/* Portfolio Items */}
      {!portfolioItems || portfolioItems.length === 0 ? (
        <div className="text-center py-8 text-[--color-text-secondary]">
          {isOwner
            ? 'No portfolio items yet. Add your first portfolio item to showcase your work!'
            : 'No portfolio items to display.'}
        </div>
      ) : (
        <div className="space-y-3">
          {portfolioItems.map((item: PortfolioItem) => (
            <EditPortfolioDialog
              key={item.id}
              item={item}
              onPortfolioUpdated={() => refetch()}
            >
              <div>
                <PortfolioCard
                  item={item}
                  canEdit={isOwner}
                  onEdit={() => {}} // Handled by the dialog wrapper
                  onDelete={() => refetch()}
                />
              </div>
            </EditPortfolioDialog>
          ))}
        </div>
      )}
    </div>
  );
}
