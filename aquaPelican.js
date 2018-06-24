require('babel-polyfill')
module.exports = async (state, emitter) => {
  state.loaded = false
  state.log = []
  sync()
  window.setInterval(() => sync(), 5000)

  async function sync() {
    console.log('sync')
    const head = getHead()
    const events = await fetchRemoteEvents(head)
    if (events != null) {
      state.log = state.log.concat(events)
    } else {
      state.log = await fetchRemoteEvents(0)
    }
    state.loaded = true
    emitter.emit('sync')
  }

  state.event = async function event(type, payload) {
    await post('/events/new', { type, payload })
    await sync()
  }

  async function fetchRemoteEvents(head = 0) {
    let { length, events } = await get(`/events/latest/${head}`)
    if (length < head - 1) {
      return null
    }
    return events
  }

  async function get(url) {
    const res = await fetch(url)
    return await res.json()
  }

  async function post(url, body) {
    const res = await fetch('/events/new', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    return await res.json()
  }

  function getHead() {
    return state.log.length
  }
}
