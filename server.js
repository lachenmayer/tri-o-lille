const bodyParser = require('body-parser')
const express = require('express')
const hypercore = require('hypercore')
const rimraf = require('rimraf')
const streamToArray = require('stream-to-array')

const dataPath = __dirname + '/.data'
const feed = hypercore('./.data', { valueEncoding: 'json' })

feed.on('ready', () => {
  const app = express()

  app.use(express.static(__dirname + '/dist'))

  app.use((req, res, next) => {
    console.log(req.url)
    next()
  })

  app.get('/events/latest/:start', (req, res) => {
    const start = req.params.start || 0
    if (feed.length == 0 || start >= feed.length) {
      return res.json({ length: feed.length, events: [] })
    }
    streamToArray(feed.createReadStream({ start }), (err, events) => {
      if (err) {
        res.status(500)
        res.json({ error: err.message })
        return
      }
      res.json({ length: feed.length, events })
    })
  })

  app.get('/events/:i', (req, res) => {
    const i = req.params.i
    feed.get(i, (err, event) => {
      if (err) {
        res.status(500)
        res.json({ error: err.message })
        return
      }
      res.json(event)
    })
  })

  app.post('/events/new', bodyParser.json(), (req, res) => {
    const event = req.body
    if (typeof event.type !== 'string') {
      res.status(400)
      res.json({ error: 'event needs type' })
      return
    }
    feed.append(event, err => {
      if (err) {
        res.status(500)
        res.json({ error: err.message })
        return
      }
      res.json({})
    })
  })

  app.get('/reset', (req, res) => {
    rimraf(dataPath, err => {
      if (err) {
        res.status(500)
        res.json({ error: err.message })
        return
      }
      res.json({})
    })
  })

  const listener = app.listen(process.env.PORT || 3000, function() {
    console.log('Your app is listening on port ' + listener.address().port)
  })
})
