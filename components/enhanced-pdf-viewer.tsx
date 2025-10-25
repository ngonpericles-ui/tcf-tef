'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  X, 
  Download, 
  Maximize2, 
  Minimize2,
  FileText,
  Search,
  BookOpen
} from 'lucide-react';
import { useLang } from '@/components/language-provider';

interface EnhancedPDFViewerProps {
  url: string;
  title?: string;
  onClose?: () => void;
  className?: string;
  allowDownload?: boolean;
}

export default function EnhancedPDFViewer({
  url,
  title = 'PDF Document',
  onClose,
  className = '',
  allowDownload = true
}: EnhancedPDFViewerProps) {
  const { lang } = useLang();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [url, title]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setError(t('Erreur lors du chargement du PDF', 'Error loading PDF'));
  }, [t]);

  useEffect(() => {
    // Reset loading state when URL changes
    setIsLoading(true);
    setError(null);
  }, [url]);

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-gray-900 flex flex-col'
    : `relative w-full h-full bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden ${className}`;

  return (
    <div className={containerClass}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold truncate max-w-md">
              {title}
            </h3>
            <p className="text-sm text-blue-100">
              {t('Document PDF', 'PDF Document')} • {zoom}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <div className="flex items-center bg-white/10 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title={t('Réduire', 'Zoom out')}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium text-white min-w-12 text-center px-2">
              {zoom}%
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 300}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title={t('Agrandir', 'Zoom in')}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Rotate */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
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
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title={t('Télécharger', 'Download')}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
            title={t('Plein écran', 'Fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Close */}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title={t('Fermer', 'Close')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('Chargement du document...', 'Loading document...')}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
            <Card className="max-w-md mx-4">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('Erreur de chargement', 'Loading Error')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {error}
                </p>
                <Button 
                  onClick={() => window.open(url, '_blank')}
                  className="w-full"
                >
                  {t('Ouvrir dans un nouvel onglet', 'Open in new tab')}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="w-full h-full flex items-center justify-center p-4">
          <div
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
              transition: 'transform 0.3s ease-out'
            }}
            className="shadow-2xl rounded-lg overflow-hidden"
          >
            <iframe
              ref={iframeRef}
              src={`${url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
              className="border-0 rounded-lg"
              style={{
                width: '900px',
                height: '1200px',
                minWidth: '900px',
                minHeight: '1200px'
              }}
              title={title}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{t('Document PDF', 'PDF Document')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>{t('Recherche disponible', 'Search available')}</span>
            </div>
          </div>
          <div className="text-xs">
            {t('Utilisez Ctrl+F pour rechercher', 'Use Ctrl+F to search')}
          </div>
        </div>
      </div>
    </div>
  );
}
