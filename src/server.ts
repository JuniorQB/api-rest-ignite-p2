import fastify from 'fastify'

const app = fastify()

app.get('/', async (req, res) => {})

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('server online')
  })
