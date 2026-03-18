/**
 * Splits raw AI output into individual named files.
 * The AI is instructed to use the separator:
 *   === FILE: filename.html ===
 */
export function parseGeneratedFiles(
  text: string,
): Array<{ name: string; content: string }> {
  const files: Array<{ name: string; content: string }> = [];
  const pattern = /={3} FILE: (.+?) ={3}\n([\s\S]*?)(?=\n={3} FILE:|\s*$)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const name = match[1].trim();
    // Strip markdown code fences if the AI wrapped the content (```html ... ```)
    const raw = match[2].trim();
    const content = raw
      .replace(/^```[\w]*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .trim();
    if (content) {
      files.push({ name, content });
    }
  }

  return files;
}

/**
 * Extracts the :root CSS block and the <nav>…</nav> block from the first
 * generated file (index.html) so continuation calls can inherit the design system.
 */
export function extractDesignSystem(text: string): {
  rootCss: string;
  navHtml: string;
} {
  const rootMatch = text.match(/:root\s*\{([\s\S]{50,}?)\}/);
  const rootCss   = rootMatch ? `:root {\n${rootMatch[1]}\n}` : '';

  const navMatch = text.match(/<nav[\s\S]*?<\/nav>/i);
  const navHtml  = navMatch ? navMatch[0] : '';

  return { rootCss, navHtml };
}
