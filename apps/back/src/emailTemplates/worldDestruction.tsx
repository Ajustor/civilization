import * as React from 'react'

import {
  Body,
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
    <Preview>Le monde est détruit !</Preview>
    <Body>
      <Container>
        <Heading>Une catastrophe à eu lieu !</Heading>
        <Text>
          Le monde tel que vous le connaissiez a été drétruit, toutes les
          civilisations ont été éradiquées !
        </Text>
        <Text>
          Vous pouvez en créer de nouvelles dans le nouveau monde qui vient de
          naitre de cette destruction
        </Text>
      </Container>
    </Body>
  </Html>
)
