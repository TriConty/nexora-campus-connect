import { useState } from 'react';
import { Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

// Posters are meant to be seen by everyone, so they are stored publicly.
export default function ImageUpload({ onUploaded, label = 'Upload image', multiple = false }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    const bad = files.find((f) => !/^image\/(png|jpe?g|webp|gif)$/.test(f.type) || f.size > 5 * 1024 * 1024);
    if (bad) { toast.error('Images only (PNG, JPG, WEBP, GIF), up to 5 MB each'); return; }
    setBusy(true);
    try {
      const urls = [];
      for (const file of files) urls.push((await base44.integrations.Core.UploadPublicFile({ file })).file_url);
      onUploaded(urls);
    } catch { toast.error('Upload failed. Please try again.'); }
    setBusy(false);
  };
  return (
    <label className="inline-block cursor-pointer">
      <input type="file" accept="image/*" multiple={multiple} className="sr-only" onChange={pick} disabled={busy} />
      <span className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-secondary">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}{label}
      </span>
    </label>
  );
}
