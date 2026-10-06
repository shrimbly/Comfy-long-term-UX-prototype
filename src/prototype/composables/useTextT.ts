import { useI18n } from 'vue-i18n'

// Project and deployment names ("Matte R&D") are user text. The app escapes
// i18n parameters for v-html safety, which prints "&amp;" through a text
// binding. Use this only for strings that land in text nodes or plain text
// (clipboard), never in v-html.
export function useTextT() {
  const { t } = useI18n()
  return (key: string, named: Record<string, unknown>) =>
    t(key, named, { escapeParameter: false })
}
