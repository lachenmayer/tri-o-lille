module.exports = async (state, emitter) => {
  state.loaded = false
  state.log = []
  sync()

  async function sync() {
    const head = getHead()
    const events = await fetchRemoteEvents(head)
    state.loaded = true
    state.log = state.log.concat(events)
    emitter.emit('sync')
  }

  state.event = async function event(type, payload) {
    await post('/events/new', { type, payload })
    await sync()
  }

  async function fetchRemoteEvents(head = 0) {
    let { events } = await get(`/events/latest/${head}`)
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
