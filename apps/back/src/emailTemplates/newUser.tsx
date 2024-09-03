import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
  Button,
  Heading,
} from '@react-email/components'

interface EmailTemplateProps {
  username: string
}

export const NewUserEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  username,
}) => (
  <Html>
    <Head />
    <Preview>Bienvenue {username}!</Preview>
    <Body>
      <Container>
        <Heading>
          Il semble que vous veniez de créer votre compte {username} !
        </Heading>
        <Text>Rejoignez nous dans l'aventure !</Text>
        <Button
          className='box-border w-full rounded-[8px] bg-indigo-600 px-[12px] py-[12px] text-center font-semibold text-white'
          href={`${Bun.env.fontUrl}/login`}
        >
          Rejoindre l'aventure
        </Button>
      </Container>
    </Body>
  </Html>
)
