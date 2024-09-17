import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
  Tailwind,
  Hr,
  Section,
  Row,
  Column,
} from '@react-email/components'
import { Civilization, CivilizationBuilder } from '@ajustor/simulation'

interface WorldDestructionEmailTemplateProps {
  topCivilizations: Civilization[]
}

export const WorldDestructionEmailTemplate = ({
  topCivilizations,
}: WorldDestructionEmailTemplateProps) => (
  <Tailwind>
    <Html>
      <Head />
      <Preview>Le monde est détruit !</Preview>
      <Body>
        <Container className='text-center'>
          <Heading className='m-0'>Une catastrophe à eu lieu !</Heading>
          <Text>
            Le monde tel que vous le connaissiez a été drétruit, toutes les
            civilisations ont été éradiquées !
          </Text>
          <Img
            className='m-0 w-full'
            src='https://media1.tenor.com/m/uGbfuGhzPh0AAAAC/sry-sorry.gif'
            alt='Une météorite qui tombe'
          />
          <Hr />
          <Section>
            <Heading as='h2'>
              Top 3 des civilisations les plus anciennes
            </Heading>
            {topCivilizations.map(({ name }, index) => (
              <Row>
                <Column>
                  {index + 1} {name}
                </Column>
              </Row>
            ))}
          </Section>
          <Text>
            Vous pouvez en créer de nouvelles dans le nouveau monde qui vient de
            naitre de cette destruction
          </Text>
        </Container>
      </Body>
    </Html>
  </Tailwind>
)

WorldDestructionEmailTemplate.PreviewProps = {
  topCivilizations: [
    new CivilizationBuilder().withName('Bernard').build(),
    new CivilizationBuilder().withName('Yves').build(),
    new CivilizationBuilder().withName('Paul').build(),
  ],
} as WorldDestructionEmailTemplateProps

export default WorldDestructionEmailTemplate
