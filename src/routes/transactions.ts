import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'

import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-sessionid-exists'
import { request } from 'http'

export async function transactionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req, res) => {
    console.log(`[${req.method}]`)
  })
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies
    console.log(sessionId)

    const transactions = await knex('transactions')
      .where('session_id', sessionId)
      .select('*')

    return { transactions }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (req) => {
    const { sessionId } = req.cookies
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const params = getTransactionParamsSchema.parse(req.params)

    const transaction = await knex('transactions')
      .where({
        session_id: sessionId,
        id: params.id,
      })
      .first()

    return { transaction }
  })

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { sessionId } = request.cookies
      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return { summary }
    },
  )

  app.post('/', async (req, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(req.body)

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }
    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
