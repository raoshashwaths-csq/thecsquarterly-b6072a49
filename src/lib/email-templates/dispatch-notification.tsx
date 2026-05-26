import {
  Body, Container, Head, Heading, Html, Link, Preview, Section, Text, Hr,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'The CS Quarterly'
const SITE_URL = 'https://www.thecsquarterly.com'

interface Props {
  title?: string
  subtitle?: string
  excerpt?: string
  slug?: string
  section?: string
  readMinutes?: number
}

const DispatchNotificationEmail = ({
  title,
  subtitle,
  excerpt,
  slug,
  section,
  readMinutes,
}: Props) => {
  const url = slug ? `${SITE_URL}/insights/${slug}` : SITE_URL
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{excerpt || title || 'A new dispatch from The CS Quarterly'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>
            {SITE_NAME.toUpperCase()} · {(section || 'NEW DISPATCH').toUpperCase()}
            {readMinutes ? ` · ${readMinutes} MIN READ` : ''}
          </Text>
          <Heading style={h1}>{title || 'A new dispatch is live.'}</Heading>
          {subtitle ? <Text style={sub}>{subtitle}</Text> : null}

          <Hr style={hr} />

          {excerpt ? <Text style={lede}>{excerpt}</Text> : null}

          <Section style={ctaWrap}>
            <Link href={url} style={cta}>
              Read the dispatch
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You're receiving this because you're a Vanguard subscriber to {SITE_NAME}.
            Reply with thoughts — we read every one.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: DispatchNotificationEmail,
  subject: (data: Record<string, any>) =>
    data?.title ? `New dispatch: ${data.title}` : 'A new dispatch from The CS Quarterly',
  displayName: 'Dispatch notification',
  previewData: {
    title: 'The Escalation Tax',
    subtitle: 'Why your best CSMs spend 40% of their week on the wrong accounts.',
    excerpt:
      'Three facts, two insights, one move you can make on Monday morning to reclaim retention time.',
    slug: 'the-escalation-tax',
    section: 'The CS Vanguard',
    readMinutes: 9,
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Source Serif 4', Georgia, serif",
  color: '#1a1a1a',
  margin: 0,
  padding: 0,
}
const container = { maxWidth: '560px', margin: '0 auto', padding: '48px 28px 32px' }
const eyebrow = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: '10px',
  letterSpacing: '0.28em',
  color: '#9B3328',
  margin: '0 0 22px',
  textTransform: 'uppercase' as const,
}
const h1 = {
  fontFamily: "'Newsreader', Georgia, serif",
  fontSize: '34px',
  lineHeight: 1.1,
  letterSpacing: '-0.01em',
  fontWeight: 500,
  color: '#1a1a1a',
  margin: '0 0 14px',
}
const sub = {
  fontFamily: "'Newsreader', Georgia, serif",
  fontSize: '18px',
  fontStyle: 'italic',
  lineHeight: 1.4,
  color: '#4a4a4a',
  margin: '0 0 18px',
}
const lede = { fontSize: '16px', lineHeight: 1.65, color: '#2a2a2a', margin: '0 0 24px' }
const hr = { border: 'none', borderTop: '1px solid #e6e1d8', margin: '28px 0' }
const ctaWrap = { margin: '24px 0 8px' }
const cta = {
  display: 'inline-block',
  backgroundColor: '#1a1a1a',
  color: '#FBF9F6',
  padding: '12px 22px',
  fontSize: '13px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  textDecoration: 'none',
  borderRadius: '2px',
}
const footer = { fontSize: '12px', lineHeight: 1.6, color: '#6b6b6b', margin: '20px 0 0' }
