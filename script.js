const startButton = document.getElementById('start')
const resetButton = document.getElementById('reset')
const speedOption = document.getElementById('wpm')
const skinOption = document.getElementById('skin')
const textarea = document.getElementById('textarea')
const output = document.getElementById('output')
const status = document.getElementById('status')
let timer;
let words = [];
let cur = 0;
// let wpm = 300;
let wpm = 200;
let average_word_length = 6;
let MAJOR_BREAK = /[.!?"“”]$/
let MINOR_BREAK = /[,;:]$/
let ENDS = /[.!?"“”,;:«»]$/
let STARTS = /^[-–—«»"“”]/
let running = false
const PARAGRAPH_BREAK = 'PARAGRAPH_BREAK'
const SENTENCE_BREAK = 'SENTENCE_BREAK'
let skin = 'yellowonblack'

const saveText = () => {
  localStorage.setItem("text", textarea.value)
  saveSettings()
}
const saveSettings = () => {
  localStorage.setItem("cur", cur)
  localStorage.setItem("wpm", wpm)
  localStorage.setItem("skin", skin)
  render()
}
const loadSettings = () => {
  textarea.value = localStorage.getItem("text") || ''
  if (localStorage.getItem("cur")) {
    cur = parseInt(localStorage.getItem("cur"))
  }
  if (localStorage.getItem("wpm")) {
    wpm = parseInt(localStorage.getItem("wpm"))
  }
  if (localStorage.getItem("skin")) {
    skin = localStorage.getItem("skin")
  }
  loadText()
  render()
}
const render = () => {
  if (words.length > 0) {
    status.style.width = `${(cur/words.length*100)}%`
    startButton.innerHTML = `Continue (${Math.floor(cur/words.length*100)}%)`
  }
  if (cur == 0) {
    startButton.innerHTML = 'Start'
  }
  speedOption.value = wpm
  skinOption.value = skin
  document.body.setAttribute('data-skin', skin)
}

textarea.addEventListener('click', (e) => {
  e.stopPropagation();
})

startButton.addEventListener('click', (e) => {
  e.stopPropagation();
  start()
})

resetButton.addEventListener('click', (e) => {
  e.stopPropagation();
  reset()
  start()
})

skinOption.addEventListener('change', (e) => {
  skin = skinOption.value
  saveSettings()
})

speedOption.addEventListener('click', (e) => {
  e.stopPropagation();
})

speedOption.addEventListener('change', (e) => {
  wpm = parseInt(speedOption.value)
  saveSettings()
})

textarea.addEventListener('change', (e) => {
  cur = 0
  render()
})
textarea.addEventListener('keyup', (e) => {
  cur = 0
  render()
})

document.body.addEventListener('click', () => {
  if (running) {
    stop()
  } else {
    // start()
  }
})

const reset = () => {
  cur = 0
}

const loadText = () => {
  words = textarea.value
    .split(/\n\n+/g).filter(Boolean).join(' ' + PARAGRAPH_BREAK + ' ')
    .replace(/([.!?"“”]) /g, '$1 ' + SENTENCE_BREAK + ' ')
    .replace(/SENTENCE_BREAK PARAGRAPH_BREAK/g, 'PARAGRAPH_BREAK')
    .split(/\s+/g).filter(Boolean)
}

const start = () => {
  loadText()
  if (cur >= words.length) {
    reset()
  }
  running = true
  saveText()
  next()
  document.body.classList.add('running')
}

const stop = () => {
  running = false
  timer && clearTimeout(timer)
  document.body.classList.remove('running')
}

const timeoutAndNext = (multiplier, add) => {
  let ms = (multiplier || 1) * (60 * 1 / wpm) * 1000
  // ms += add || 0
  timer && clearTimeout(timer)
  timer = setTimeout(() => next(), ms)
}

const next = () => {
  if (!document.hasFocus() || cur >= words.length) {
    return stop()
  }
  let word = words[cur]
  if (word !== PARAGRAPH_BREAK && word !== SENTENCE_BREAK) {
    for (let i = 1; word.length < 9 && cur + i < words.length; i++) {
      let word_to_add = words[cur + i]
      if (word_to_add === PARAGRAPH_BREAK || word_to_add === SENTENCE_BREAK) {
        break;
      }
      if (word_to_add === undefined || word.length + word_to_add.length > 8 || ENDS.test(word) || STARTS.test(word_to_add)) {
        break;
      }
      if (words[cur + i].length <= 3 && words[cur + i + 1] && words[cur + i + 1].length > 4) {
        break;
      }
      word += ' ' + word_to_add
    }
  }
  // console.log(word)
  let multiplier = clamp(Math.cbrt(word.length / average_word_length), 0.7, 1.3)
  cur = cur + word.split(' ').length
  let add = 0
  if (word === PARAGRAPH_BREAK) {
    word = ''
    multiplier = 2
  } else if (word === SENTENCE_BREAK) {
    word = ''
    multiplier = 1
  }
  // else if (MAJOR_BREAK.test(word) && words[cur + 1] !== PARAGRAPH_BREAK) {
  //   multiplier = 2
  // }
  else if (MINOR_BREAK.test(word)) {
    multiplier = 1.4
  }
  output.innerHTML = '&nbsp;'.repeat(Math.max(0, (word.length - 4) / 0.8)) + word
  timeoutAndNext(multiplier, add)
  saveSettings()
}

const clamp = function (input, min, max) {
  return Math.min(Math.max(input, min), max);
};

loadSettings()
