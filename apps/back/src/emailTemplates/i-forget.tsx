import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
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
        <Heading>
          Il semble que vous ne vous souvenez plus de votre mot de passe{' '}
          {username}!
        </Heading>
        <Text>
          Voici un lien pour réinitialiser votre mot de passe, bon jeu !
        </Text>
        <Button
          className="box-border w-full rounded-[8px] bg-indigo-600 px-[12px] py-[12px] text-center font-semibold text-white"
          href={`${Bun.env.frontUrl}/i-forgot?authorizationKey=${authorizationKey}&userId=${userId}`}
        >
          Réinitialiser mon mot de passe
        </Button>
      </Container>
    </Body>
  </Html>
)
