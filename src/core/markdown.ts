import { marked } from 'marked'
import DOMPurify from 'dompurify'

export function renderMarkdown(text: string): string {
  const html = marked(text, { async: false, gfm: true, breaks: true })
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}
