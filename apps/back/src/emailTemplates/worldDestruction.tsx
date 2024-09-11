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

export const WorldDestructionEmailTemplate: React.FC = () => (
  <Html>
    <Head />
    <Preview>Bienvenue !</Preview>
    <Body>
      <Container>
        <Heading>Il semble que vous veniez de créer votre compte !</Heading>
        <Text>Rejoignez nous dans l'aventure !</Text>
        <Button
          className='box-border w-full rounded-[8px] bg-indigo-600 px-[12px] py-[12px] text-center font-semibold text-white'
          href={`${Bun.env.frontUrl}/login`}
        >
          Rejoindre l'aventure
        </Button>
      </Container>
    </Body>
  </Html>
)
