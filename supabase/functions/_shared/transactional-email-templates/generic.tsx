import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface GenericEmailProps {
  subject?: string
  heading?: string
  bodyHtml?: string
  bodyText?: string
  ctaText?: string
  ctaUrl?: string
  footer?: string
  unsubscribeUrl?: string
}

export const GenericEmail = ({
  subject = 'Launchely',
  heading,
  bodyHtml,
  bodyText,
  ctaText,
  ctaUrl,
  footer,
  unsubscribeUrl,
}: GenericEmailProps) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#1a1a1a', margin: 0, padding: 0 }}>
      <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }}>
        <Section style={{ marginBottom: '24px' }}>
          <Text style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c2410c', margin: 0 }}>
            Launchely
          </Text>
        </Section>
        {heading && (
          <Heading style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 16px' }}>
            {heading}
          </Heading>
        )}
        {bodyHtml ? (
          <div
            style={{ fontSize: '15px', lineHeight: '24px', color: '#333' }}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : (
          <Text style={{ fontSize: '15px', lineHeight: '24px', color: '#333', whiteSpace: 'pre-wrap' }}>
            {bodyText}
          </Text>
        )}
        {ctaText && ctaUrl && (
          <Section style={{ margin: '32px 0' }}>
            <Link
              href={ctaUrl}
              style={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              {ctaText}
            </Link>
          </Section>
        )}
        {footer && (
          <Text style={{ fontSize: '13px', color: '#666', marginTop: '32px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
            {footer}
          </Text>
        )}
        {unsubscribeUrl && (
          <Text style={{ fontSize: '12px', color: '#999', marginTop: '16px', textAlign: 'center' as const }}>
            <Link href={unsubscribeUrl} style={{ color: '#999' }}>Unsubscribe</Link>
          </Text>
        )}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: GenericEmail,
  subject: (data: GenericEmailProps) => data.subject || 'Launchely',
  displayName: 'Generic',
  previewData: {
    subject: 'Hello from Launchely',
    heading: 'Welcome',
    bodyText: 'This is a generic transactional email.',
    ctaText: 'Open Launchely',
    ctaUrl: 'https://app.launchely.com',
  },
} satisfies TemplateEntry
