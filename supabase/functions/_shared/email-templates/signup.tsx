/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          .
        </Text>
        <Text style={text}>
          Confirm your address (
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
          ) to start your launch:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify my email
        </Button>
        <Text style={footer}>
          Didn't create an account? You can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', color: 'hsl(28, 13%, 12%)' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic' as const, fontSize: '28px', fontWeight: 500 as const, color: 'hsl(28, 13%, 12%)', margin: '0 0 20px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: 'hsl(28, 13%, 30%)', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: 'hsl(13, 56%, 51%)', textDecoration: 'underline' }
const button = { backgroundColor: 'hsl(13, 56%, 51%)', color: '#ffffff', fontSize: '14px', fontWeight: 600 as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
