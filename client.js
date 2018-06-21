require('babel-polyfill')
const choo = require('choo')
const html = require('choo/html')

const aquaPelican = require('./aquaPelican')

const app = choo()
app.route('/', (state, emit) => {
  if (!state.loaded) {
    return html`<main><h1>Tri Oli Challenge</h1></main>`
  }
  return html`
    <main>
      <h1>Tri-O-Lille Challenge</h1>
      <h2>Best Olis 👑</h2>
      ${state.leaderboard.map(
        oli =>
          html`<div class="row"><div class="name">${oli}</div><div class="score">${
            state.olis[oli]
          }</div></div>`
      )}
      
      <h2>Award an Oli ✨</h2>
      <div class="choose-oli">
      ${Object.keys(state.olis).map(
        oli =>
          html`<div class="button choice${
            state.chosen === oli ? ' chosen' : ''
          }" onclick=${() => {
            emit('choose', oli)
          }}>${oli}</div>`
      )}
      </div>
      ${
        state.chosen != null
          ? html`
      <div class="make-it-happen">
      <div class="button more" onclick=${() =>
        emit('more', state.chosen)}>💯</div>
      <div class="button less" onclick=${() =>
        emit('less', state.chosen)}>🤔</div>
      </div>
      `
          : ''
      }
    </main>`
})
app.use(aquaPelican)
app.use((state, emitter) => {
  const lessAudio = document.getElementById('less-sound')
  const moreAudio = document.getElementById('more-sound')
  function initialOlis() {
    return { Galt: 0, Marshall: 0, Jones: 0 }
  }
  state.olis = initialOlis()
  emitter.on('sync', () => {
    state.olis = state.log.reduce(function(scores, event) {
      if (event.type === 'more') {
        scores[event.payload]++
      } else if (event.type === 'less') {
        scores[event.payload]--
      }
      return scores
    }, initialOlis())
    state.leaderboard = Object.entries(state.olis)
      .sort((a, b) => {
        return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0
      })
      .map(x => x[0])
    emitter.emit('render')
  })

  emitter.on('choose', name => {
    state.chosen = name
    emitter.emit('render')
  })
  emitter.on('less', name => {
    state.event('less', name)
    lessAudio && lessAudio.play()
    state.chosen = null
  })
  emitter.on('more', name => {
    state.event('more', name)
    moreAudio && moreAudio.play()
    state.chosen = null
  })
})
app.mount(document.querySelector('main'))
