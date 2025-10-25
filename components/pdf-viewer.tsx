'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, X } from 'lucide-react';
import { useLang } from '@/components/language-provider';

interface PDFViewerProps {
  url: string;
  title?: string;
  onClose?: () => void;
  className?: string;
  allowDownload?: boolean;
}

export default function PDFViewer({
  url,
  title = 'PDF Document',
  onClose,
  className = '',
  allowDownload = false
}: PDFViewerProps) {
  const { lang } = useLang();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 300));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 50));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [url, title]);

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-black flex flex-col'
    : `relative w-full h-full bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden ${className}`;

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('Zoom:', 'Zoom:')} {zoom}%
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            title={t('Réduire', 'Zoom out')}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-12 text-center">
            {zoom}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 300}
            title={t('Agrandir', 'Zoom in')}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Rotate */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            title={t('Tourner', 'Rotate')}
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* Download */}
          {allowDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              title={t('Télécharger', 'Download')}
            >
              📥
            </Button>
          )}

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={t('Plein écran', 'Fullscreen')}
          >
            {isFullscreen ? '⛔' : '⛶'}
          </Button>

          {/* Close */}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title={t('Fermer', 'Close')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center',
            transition: 'transform 0.2s ease-out'
          }}
        >
          <iframe
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-0 rounded"
            style={{
              width: '800px',
              height: '1000px',
              minWidth: '800px',
              minHeight: '1000px'
            }}
            title={title}
            onError={() => {
              // Fallback if iframe fails
              console.error('Failed to load PDF');
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4 text-center text-sm text-gray-600 dark:text-gray-400">
        {t(
          'Utilisez les contrôles ci-dessus pour naviguer dans le document',
          'Use the controls above to navigate the document'
        )}
      </div>
    </div>
  );
}

