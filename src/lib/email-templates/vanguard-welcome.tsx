import {
  Body, Container, Head, Heading, Html, Link, Preview, Section, Text, Hr,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'The CS Quarterly'
const SITE_URL = 'https://www.thecsquarterly.com'

interface Props {
  name?: string
}

const VanguardWelcomeEmail = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to the Vanguard — your full access to {SITE_NAME} is live.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>THE CS QUARTERLY · VANGUARD</Text>
        <Heading style={h1}>
          Welcome to the Vanguard{name ? `, ${name}` : ''}.
        </Heading>
        <Text style={lede}>
          You now have unrestricted access to every dispatch, both voices, the full Codex,
          quarterly NRR &amp; Payback data drops, and Q — our retention agent.
        </Text>

        <Hr style={hr} />

        <Section>
          <Text style={sectionLabel}>WHAT'S UNLOCKED</Text>
          <Text style={item}>
            <strong>Two voices, every essay.</strong> Toggle between the analytical and witty register on any dispatch.
          </Text>
          <Text style={item}>
            <strong>The full Codex.</strong> Definitions, frameworks, and reference material — no paywall.
          </Text>
          <Text style={item}>
            <strong>Q, the retention agent.</strong> Unlimited runs across all eight diagnostic trees.
          </Text>
          <Text style={item}>
            <strong>NRR &amp; Payback data drops.</strong> Quarterly benchmarks, members only.
          </Text>
        </Section>

        <Section style={ctaWrap}>
          <Link href={`${SITE_URL}/vanguard`} style={cta}>
            Open the Vanguard
          </Link>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          You're receiving this because your Vanguard access was provisioned at {SITE_NAME}.
          Reply to this email if anything looks off — a human reads every reply.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: VanguardWelcomeEmail,
  subject: 'Welcome to the Vanguard.',
  displayName: 'Vanguard welcome',
  previewData: { name: 'Sakthi' },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif",
  color: '#1a1a1a',
  margin: 0,
  padding: 0,
}
const container = { maxWidth: '560px', margin: '0 auto', padding: '48px 28px 32px' }
const eyebrow = {
  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: '10px',
  letterSpacing: '0.28em',
  color: '#9B3328',
  margin: '0 0 22px',
  textTransform: 'uppercase' as const,
}
const h1 = {
  fontFamily: "'Newsreader', Georgia, 'Times New Roman', serif",
  fontSize: '34px',
  lineHeight: 1.1,
  letterSpacing: '-0.01em',
  fontWeight: 500,
  color: '#1a1a1a',
  margin: '0 0 18px',
}
const lede = { fontSize: '16px', lineHeight: 1.6, color: '#2a2a2a', margin: '0 0 28px' }
const hr = { border: 'none', borderTop: '1px solid #e6e1d8', margin: '28px 0' }
const sectionLabel = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: '10px',
  letterSpacing: '0.28em',
  color: '#B19453',
  margin: '0 0 14px',
  textTransform: 'uppercase' as const,
}
const item = { fontSize: '15px', lineHeight: 1.6, color: '#1a1a1a', margin: '0 0 12px' }
const ctaWrap = { margin: '32px 0 8px' }
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
