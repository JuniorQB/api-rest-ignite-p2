import fastify from 'fastify'
import { knex } from './database'

const app = fastify()

app.get('/hello', async (req, res) => {
  const transactions = await knex('transactions')
    .insert({
      id: crypto.randomUUID(),
      title: 'Transação de teste',
      amount: 1000,
    })
    .returning('*')

  return transactions
})

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('server online')
  })
