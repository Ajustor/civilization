import Elysia from 'elysia'
import { ReactNode } from 'react'
import { Resend } from 'resend'


export class EmailSender {
  private client = new Resend(Bun.env.RESEND_API_KEY)

  public async sendEmail(to: string, subject: string, template: ReactNode) {
    const { data, error } = await this.client.emails.send({
      from: 'My Civilizations <no-reply@civilizations.darthoit.eu>',
      to,
      subject,
      react: template,
    })

    if (error) {

      console.error(error)
      return new Response(JSON.stringify({ error }))
    }

    return new Response(JSON.stringify({ data }))
  }

  public async sendBatch(bcc: string[], subject: string, template: ReactNode) {
    const { data, error } = await this.client.batch.send(bcc.map((to) => ({
      from: 'My Civilizations <no-reply@civilizations.darthoit.eu>',
      to,
      subject,
      react: template,
    })))

    if (error) {

      console.error(error)
      return new Response(JSON.stringify({ error }))
    }

    console.log(data)

    return new Response(JSON.stringify({ data }))
  }
}

export const emailSender = new Elysia({ name: 'EmailSender' }).derive(({ }) => {
  return { emailSender: new EmailSender() }
}).as('plugin')
