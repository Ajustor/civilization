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

interface WorldDestructionEmailTemplateProps {
  topCivilizationsNames: string[]
}

export const WorldDestructionEmailTemplate = ({
  topCivilizationsNames,
}: WorldDestructionEmailTemplateProps) => {
  const civilizationsNamesTable = () => {
    let result: string[][] = []
    for (let i = 0; i < topCivilizationsNames.length; i++) {
      result[~~(i / 3)] ??= []
      result[~~(i / 3)].push(topCivilizationsNames[i])
    }
    return result
  }
  let offset = 1
  return (
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
              alt='Une météorite qui tombe sur la terre'
            />
            <Hr />
            <Section>
              <Heading as='h2'>
                Civilisations de la plus ancienne à la plus récente
              </Heading>
              {civilizationsNamesTable().map(
                ([firstName, secondName, thirdhName]) => (
                  <Row>
                    <Column>
                      {offset++} - {firstName}
                    </Column>
                    <Column>
                      {offset++} - {secondName}
                    </Column>
                    <Column>
                      {offset++} - {thirdhName}
                    </Column>
                  </Row>
                )
              )}
            </Section>
            <Text>
              Vous pouvez en créer de nouvelles dans le nouveau monde qui vient
              de naitre de cette destruction
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}

WorldDestructionEmailTemplate.PreviewProps = {
  topCivilizationsNames: [
    'Bernard',
    'Yves',
    'Paul',
    'Jacques',
    'Edouard',
    'Pierre',
  ],
} as WorldDestructionEmailTemplateProps

export default WorldDestructionEmailTemplate
