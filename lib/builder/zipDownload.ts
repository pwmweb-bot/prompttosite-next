import JSZip from 'jszip';

export async function downloadAsZip(
  files: Array<{ name: string; content: string }>,
  siteName: string,
): Promise<void> {
  if (files.length === 1) {
    triggerDownload(files[0].name, files[0].content, 'text/html');
    return;
  }

  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f.content));
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(`${siteName || 'website'}.zip`, blob, 'application/zip');
}

export function triggerDownload(
  filename: string,
  content: Blob | string,
  type: string,
): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
