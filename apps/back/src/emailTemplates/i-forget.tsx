import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
  Button,
} from '@react-email/components'

interface EmailTemplateProps {
  username: string
  authorizationKey: string
  userId: string
}

export const IForgetEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  username,
  authorizationKey,
  userId,
}) => (
  <Html>
    <Head />
    <Preview>
      Il semble que vous ne vous souvenez plus de votre mot de passe {username}!
    </Preview>
    <Body>
      <Container>
        <Text>
          Voici un lien pour réinitialiser votre mot de passe, bon jeu !
        </Text>
        <Button
          href={`${Bun.env.fontUrl}/i-forgot?authorizationKey=${authorizationKey}&userId=${userId}`}
        >
          Réinitialiser mon mot de passe
        </Button>
      </Container>
    </Body>
  </Html>
)
