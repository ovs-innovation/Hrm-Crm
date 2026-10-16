/**
 * Lightweight HTML sanitizer for LLM-generated briefings.
 * Strips scripts, handlers, and dangerous URLs — keeps basic formatting tags.
 */
export function sanitizeHtml(input) {
  if (input == null) return '';
  let html = String(input);

  html = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(?:iframe|object|embed|link|meta|base|form|input|button|textarea|select)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src|xlink:href)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"')
    .replace(/\s(href|src|xlink:href)\s*=\s*javascript:[^\s>]*/gi, ' $1="#"')
    .replace(/data:\s*text\/html/gi, 'data:text/plain');

  return html;
}
