import { ReactNode } from 'react'
import { Resend } from 'resend'

export class EmailSender {
  private client = new Resend(Bun.env.RESEND_API_KEY)

  public async sendEmail(to: string, template: ReactNode) {
    const { data, error } = await this.client.emails.send({
      from: 'My Civilizations <no-reply@civilizations.netlify.eu>',
      to: [to],
      subject: 'Mot de passe oublié',
      react: template,
    })

    if (error) {
      return new Response(JSON.stringify({ error }))
    }

    return new Response(JSON.stringify({ data }))
  }
}