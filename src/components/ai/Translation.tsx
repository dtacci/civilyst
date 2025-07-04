'use client';

import React from 'react';
import { api } from '~/lib/trpc';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { Alert, AlertDescription } from '~/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Languages,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useToast } from '~/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface TranslationProps {
  contentId: string;
  contentType: 'campaign' | 'comment' | 'update';
  content: string;
  sourceLanguage?: string;
  className?: string;
}

// Common languages for civic engagement
const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ru', name: 'Russian' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
];

export function Translation({
  contentId,
  contentType,
  content,
  sourceLanguage = 'en',
  className,
}: TranslationProps) {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>('');
  const [copiedTranslation, setCopiedTranslation] = React.useState<
    string | null
  >(null);
  const [detectedLanguage, setDetectedLanguage] = React.useState<{
    language: string;
    confidence: number;
  } | null>(null);

  // Query existing translations
  const {
    data: translations,
    isLoading: isLoadingTranslations,
    refetch: refetchTranslations,
  } = api.ai.getTranslations.useQuery({ contentId, contentType });

  // Mutation to translate content
  const translateContent = api.ai.translateContent.useMutation({
    onSuccess: () => {
      toast({
        title: 'Translation completed',
        description: 'Content has been successfully translated.',
      });
      refetchTranslations();
    },
    onError: (error) => {
      toast({
        title: 'Translation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to detect language
  const detectLanguage = api.ai.detectLanguage.useMutation({
    onSuccess: (data) => {
      setDetectedLanguage(data);
      toast({
        title: 'Language detected',
        description: `Detected ${getLanguageName(data.language)} with ${Math.round(data.confidence * 100)}% confidence.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Language detection failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleTranslate = () => {
    if (!selectedLanguage) return;

    translateContent.mutate({
      contentId,
      contentType,
      targetLanguage: selectedLanguage,
      sourceLanguage: detectedLanguage?.language || sourceLanguage,
    });
  };

  const handleDetectLanguage = () => {
    if (!content) return;
    detectLanguage.mutate({ content });
  };

  const handleCopy = async (text: string, translationId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTranslation(translationId);
      toast({
        title: 'Copied to clipboard',
        description: 'Translation has been copied.',
      });
      setTimeout(() => setCopiedTranslation(null), 2000);
    } catch (_error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getLanguageName = (code: string): string => {
    const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
    return language?.name || code.toUpperCase();
  };

  if (isLoadingTranslations) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Content Translation
            </CardTitle>
            <CardDescription>
              Translate content to make it accessible to more community members
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {translations?.length || 0} translations
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Language Detection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Source Language</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDetectLanguage}
              disabled={detectLanguage.isPending || !content}
            >
              {detectLanguage.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-detect
                </>
              )}
            </Button>
          </div>
          {detectedLanguage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Detected: {getLanguageName(detectedLanguage.language)}(
                {Math.round(detectedLanguage.confidence * 100)}% confidence)
              </span>
            </div>
          )}
        </div>

        {/* Translation Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Translate to</h4>
          <div className="flex gap-2">
            <Select
              value={selectedLanguage}
              onValueChange={setSelectedLanguage}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select target language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleTranslate}
              disabled={
                !selectedLanguage ||
                translateContent.isPending ||
                !content ||
                translations?.some(
                  (t: { targetLanguage: string }) =>
                    t.targetLanguage === selectedLanguage
                )
              }
            >
              {translateContent.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="h-4 w-4 mr-2" />
                  Translate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Existing Translations */}
        {translations && translations.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Available Translations</h4>
            <div className="space-y-3">
              {translations.map(
                (translation: {
                  id: string;
                  targetLanguage: string;
                  sourceLanguage: string;
                  translatedText: string;
                  originalText: string;
                  createdAt: Date | string;
                }) => (
                  <div
                    key={translation.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {getLanguageName(translation.sourceLanguage)} →{' '}
                          {getLanguageName(translation.targetLanguage)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(translation.createdAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(translation.translatedText, translation.id)
                        }
                      >
                        {copiedTranslation === translation.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <strong>
                          Original (
                          {getLanguageName(translation.sourceLanguage)}):
                        </strong>
                      </p>
                      <p className="text-sm bg-muted p-2 rounded">
                        {translation.originalText.slice(0, 200)}
                        {translation.originalText.length > 200 && '...'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>
                          Translation (
                          {getLanguageName(translation.targetLanguage)}):
                        </strong>
                      </p>
                      <p className="text-sm bg-background p-2 rounded border">
                        {translation.translatedText}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              No translations available yet. Select a language and click
              translate to get started.
            </AlertDescription>
          </Alert>
        )}

        {/* Content Type Badge */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant="outline" className="text-xs">
            {contentType.charAt(0).toUpperCase() + contentType.slice(1)}{' '}
            Translation
          </Badge>
          <span className="text-xs text-muted-foreground">
            AI-powered translation
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
