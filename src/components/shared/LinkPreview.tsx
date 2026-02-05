import { ExternalLink } from 'lucide-react';

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

interface LinkPreviewProps {
  previews: LinkPreviewData[];
}

export function LinkPreview({ previews }: LinkPreviewProps) {
  if (!previews || previews.length === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      {previews.map((preview, index) => (
        <a
          key={index}
          href={preview.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors"
        >
          {preview.image && (
            <div className="w-full h-48 bg-muted">
              <img
                src={preview.image}
                alt={preview.title || 'Link preview'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="p-3">
            <div className="flex items-start gap-2">
              {preview.favicon && (
                <img
                  src={preview.favicon}
                  alt=""
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                {preview.siteName && (
                  <p className="text-xs text-muted-foreground mb-1">
                    {preview.siteName}
                  </p>
                )}
                {preview.title && (
                  <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                    {preview.title}
                  </h4>
                )}
                {preview.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {preview.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-primary">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">{new URL(preview.url).hostname}</span>
                </div>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
