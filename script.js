/* eslint-env browser */
const FileSaver = require('file-saver')
const commonmark = require('commonform-commonmark')
const critique = require('commonform-critique')
const docx = require('commonform-docx')
const html = require('commonform-html')
const lint = require('commonform-lint')

const numberStyles = {
  outline: {
    label: 'Outline',
    numberStyle: require('outline-numbering')
  },
  decimal: {
    label: 'Decimal',
    numberStyle: require('decimal-numbering')
  },
  ase: {
    label: 'Agreement, Schedules, Exhibits',
    numberStyle: require('agreement-schedules-exhibits-numbering')
  },
  rse: {
    label: 'Resolutions, Schedules, Exhibits',
    numberStyle: require('resolutions-schedules-exhibits-numbering')
  }
}

const styles = {
  legible: {
    label: 'Legible',
    options: {
      centerTitle: false,
      indentMargins: true,
      styles: {
        alignment: 'left',
        heading: { italic: true },
        reference: { italic: true },
        referenceHeading: { italic: true }
      }
    }
  },
  stodgy: {
    label: 'Stodgy',
    options: {}
  }
}

const CodeMirror = require('codemirror')
require('codemirror/mode/markdown/markdown')
require('codemirror/addon/display/panel')

document.addEventListener('DOMContentLoaded', function () {
  addEditor()
  addDownloadPanel()
  addLintPanel()
  addHelpLinks()
})

function addEditor () {
  window.editor = CodeMirror(
    document.getElementById('editor'),
    {
      autofocus: true,
      spellcheck: true,
      lineWrapping: true,
      mode: 'markdown',
      gutters: ['CodeMirror-lint-markers'],
      lint: true,
      value: '# Welcome\n\nYou can use this page to type, format, and check forms.'
    }
  )
}

function addDownloadPanel () {
  const panel = document.createElement('div')
  panel.className = 'panel downloads'

  const styleSelect = makeSelect(styles)
  panel.appendChild(styleSelect)

  const numberStyleSelect = makeSelect(numberStyles)
  panel.appendChild(numberStyleSelect)

  const wordButton = document.createElement('button')
  wordButton.appendChild(document.createTextNode('Download Word'))
  wordButton.addEventListener('click', function () {
    const options = Object.assign({
      numberStyle: numberStyles[numberStyleSelect.value].numberStyle
    }, styles[styleSelect.value].options)
    let parsed
    try {
      parsed = commonmark.parse(window.editor.getValue())
    } catch (error) {
      console.error(error)
      return
    }
    docx(parsed.form, [], options)
      .generateAsync({ type: 'blob' })
      .then(function (blob) {
        const date = new Date().toISOString()
        FileSaver.saveAs(blob, 'commonform-' + date + '.docx', true)
      })
  })
  panel.appendChild(wordButton)

  const html5Check = makeCheckbox()
  panel.appendChild(html5Check)

  const html5Label = makeCheckboxLabel('HTML5')
  panel.appendChild(html5Label)

  const idsCheck = makeCheckbox()
  panel.appendChild(idsCheck)

  const idsLabel = makeCheckboxLabel('IDs')
  panel.appendChild(idsLabel)

  const listsCheck = makeCheckbox()
  panel.appendChild(listsCheck)

  const listsLabel = makeCheckboxLabel('Lists')
  panel.appendChild(listsLabel)

  const htmlButton = document.createElement('button')
  htmlButton.appendChild(document.createTextNode('Download HTML'))
  htmlButton.addEventListener('click', function () {
    let parsed
    try {
      parsed = commonmark.parse(window.editor.getValue())
    } catch (error) {
      console.error(error)
      return
    }
    const content = html(parsed.form, [], {
      html5: html5Check.checked,
      ids: idsCheck.checked,
      lists: listsCheck.checked
    })
    const blob = new Blob([content], { type: 'text/html' })
    const date = new Date().toISOString()
    FileSaver.saveAs(blob, 'commonform-' + date + '.html', true)
  })
  panel.appendChild(htmlButton)

  const jsonButton = document.createElement('button')
  jsonButton.appendChild(document.createTextNode('JSON'))
  jsonButton.addEventListener('click', function () {
    let parsed
    try {
      parsed = commonmark.parse(window.editor.getValue())
    } catch (error) {
      console.error(error)
      return
    }
    const json = JSON.stringify(parsed.form)
    const blob = new Blob([json], { type: 'application/json' })
    const date = new Date().toISOString()
    FileSaver.saveAs(blob, 'commonform-' + date + '.json', true)
  })
  panel.appendChild(jsonButton)

  window.editor.addPanel(panel, { position: 'after-top', stable: true })
}

function addLintPanel () {
  const panel = document.createElement('div')
  panel.className = 'panel annotations'

  const editor = window.editor
  editor.on('changes', function () {
    const text = editor.getValue()
    let parsed
    try {
      parsed = commonmark.parse(text)
    } catch (error) {
      return renderAnnotations([
        {
          message: 'Invalid Syntax',
          severity: 'error'
        }
      ])
    }
    const annotations = []
      .concat(lint(parsed.form))
      .concat(critique(parsed.form))
    renderAnnotations(annotations)
  })

  function renderAnnotations (annotations) {
    panel.innerHTML = ''
    const messagesSeen = []
    const unique = []
    annotations.forEach(function (annotation) {
      const message = annotation.message
      if (messagesSeen.indexOf(message) === -1) {
        messagesSeen.push(message)
        unique.push(annotation)
      }
    })
    if (unique.length === 0) return
    const ul = document.createElement('ul')
    unique.forEach(function (annotation) {
      const li = document.createElement('li')
      li.className = annotation.level
      li.appendChild(document.createTextNode(annotation.message))
      ul.appendChild(li)
      panelObject.changed()
    })
    panel.appendChild(ul)
  }

  const panelObject = window.editor.addPanel(panel, {
    position: 'after-top',
    stable: true
  })
}

function makeSelect (choices) {
  const select = document.createElement('select')
  Object.keys(choices).forEach(function (key) {
    const option = document.createElement('option')
    option.value = key
    option.appendChild(document.createTextNode(choices[key].label))
    select.appendChild(option)
  })
  return select
}

function makeCheckboxLabel (text) {
  const label = document.createElement('label')
  label.appendChild(document.createTextNode(text))
  return label
}

function makeCheckbox () {
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = 'yes'
  return checkbox
}

function addHelpLinks () {
  const p = document.createElement('p')
  p.className = 'links'

  const typeLink = document.createElement('a')
  typeLink.href = 'https://type.commonform.org'
  typeLink.target = '_blank'
  typeLink.appendChild(document.createTextNode('Typing Guide'))
  p.appendChild(typeLink)

  const githubLink = document.createElement('a')
  githubLink.href = 'https://github.com/commonform/edit.commonform.org'
  githubLink.target = '_blank'
  githubLink.appendChild(document.createTextNode('GitHub'))
  p.appendChild(githubLink)

  const emailLink = document.createElement('a')
  emailLink.href = 'mailto:kyle@commonform.org'
  emailLink.appendChild(document.createTextNode('E-Mail Kyle'))
  p.appendChild(emailLink)

  document.getElementById('main').appendChild(p)
}
