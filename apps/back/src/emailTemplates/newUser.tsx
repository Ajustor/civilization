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
  Tailwind,
} from '@react-email/components'

interface EmailTemplateProps {
  username: string
  frontUrl: string
}

export const NewUserEmailTemplate = ({
  username,
  frontUrl,
}: EmailTemplateProps) => (
  <Tailwind>
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
            href={`${frontUrl}/login`}
          >
            Rejoindre l'aventure
          </Button>
        </Container>
      </Body>
    </Html>
  </Tailwind>
)

NewUserEmailTemplate.PreviewProps = {
  username: 'Pierre',
  frontUrl: 'localhost',
} as EmailTemplateProps

export default NewUserEmailTemplate
