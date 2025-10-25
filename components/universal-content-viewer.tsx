'use client';

import React, { useMemo } from 'react';
import { detectContentType, canDisplayInline } from '@/lib/content-type-utils';
import EnhancedPDFViewer from './enhanced-pdf-viewer';
import EnhancedMediaViewer from './enhanced-media-viewer';
import { useLang } from '@/components/language-provider';
import { Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UniversalContentViewerProps {
  url: string;
  title?: string;
  mimeType?: string;
  onClose?: () => void;
  className?: string;
  allowDownload?: boolean;
  autoPlay?: boolean;
}

export default function UniversalContentViewer({
  url,
  title = 'Content',
  mimeType,
  onClose,
  className = '',
  allowDownload = false,
  autoPlay = false
}: UniversalContentViewerProps) {
  const { lang } = useLang();
  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);

  const contentInfo = useMemo(() => {
    return detectContentType(url, mimeType);
  }, [url, mimeType]);

  // Enhanced PDF Viewer
  if (contentInfo.type === 'pdf') {
    return (
      <EnhancedPDFViewer
        url={url}
        title={title}
        onClose={onClose}
        className={className}
        allowDownload={allowDownload}
      />
    );
  }

  // Enhanced Media Viewer for Audio
  if (contentInfo.type === 'audio') {
    return (
      <EnhancedMediaViewer
        url={url}
        title={title}
        type="audio"
        onClose={onClose}
        className={className}
        allowDownload={allowDownload}
        autoPlay={autoPlay}
      />
    );
  }

  // Enhanced Media Viewer for Video
  if (contentInfo.type === 'video') {
    return (
      <EnhancedMediaViewer
        url={url}
        title={title}
        type="video"
        onClose={onClose}
        className={className}
        allowDownload={allowDownload}
        autoPlay={autoPlay}
      />
    );
  }

  // Image Viewer
  if (contentInfo.type === 'image') {
    return (
      <div className={`bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <img
          src={url}
          alt={title}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }

  // Text Viewer
  if (contentInfo.type === 'text') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 overflow-auto max-h-96 ${className}`}>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {title}
        </h3>
        <iframe
          src={url}
          className="w-full h-full border-0 rounded"
          title={title}
          style={{ minHeight: '400px' }}
        />
      </div>
    );
  }

  // Document or Unknown Type - Show Download Option
  return (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="text-center">
        <div className="text-6xl mb-4">{contentInfo.icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {contentInfo.type === 'document'
            ? t(
                'Ce type de document ne peut pas être affiché en ligne.',
                'This document type cannot be displayed online.'
              )
            : t(
                'Ce type de fichier ne peut pas être affiché en ligne.',
                'This file type cannot be displayed online.'
              )}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          {t('Type:', 'Type:')} {contentInfo.displayName}
        </p>
      </div>

      <div className="flex gap-3">
        {allowDownload && (
          <Button
            onClick={() => {
              const link = document.createElement('a');
              link.href = url;
              link.download = title || 'file';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('Télécharger', 'Download')}
          </Button>
        )}
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
          >
            {t('Fermer', 'Close')}
          </Button>
        )}
      </div>

      {!allowDownload && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {t(
              'Le téléchargement n\'est pas autorisé pour ce contenu.',
              'Download is not allowed for this content.'
            )}
          </p>
        </div>
      )}
    </div>
  );
}

