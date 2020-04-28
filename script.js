/* eslint-env browser */
var FileSaver = require('file-saver')
var commonmark = require('commonform-commonmark')
var critique = require('commonform-critique')
var docx = require('commonform-docx')
var html = require('commonform-html')
var lint = require('commonform-lint')

var numberings = {
  outline: {
    label: 'Outline',
    numbering: require('outline-numbering')
  },
  decimal: {
    label: 'Decimal',
    numbering: require('decimal-numbering')
  },
  ase: {
    label: 'Agreement, Schedules, Exhibits',
    numbering: require('agreement-schedules-exhibits-numbering')
  },
  rse: {
    label: 'Resolutions, Schedules, Exhibits',
    numbering: require('resolutions-schedules-exhibits-numbering')
  }
}

var styles = {
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

var CodeMirror = require('codemirror')
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
  var panel = document.createElement('div')
  panel.className = 'panel downloads'

  var styleSelect = makeSelect(styles)
  panel.appendChild(styleSelect)

  var numberingSelect = makeSelect(numberings)
  panel.appendChild(numberingSelect)

  var wordButton = document.createElement('button')
  wordButton.appendChild(document.createTextNode('Download Word'))
  wordButton.addEventListener('click', function () {
    var options = Object.assign({
      numbering: numberings[numberingSelect.value].numbering
    }, styles[styleSelect.value].options)
    try {
      var parsed = commonmark.parse(window.editor.getValue())
    } catch (error) {
      console.error(error)
      return
    }
    docx(parsed.form, [], options)
      .generateAsync({ type: 'blob' })
      .then(function (blob) {
        var date = new Date().toISOString()
        FileSaver.saveAs(blob, 'commonform-' + date + '.docx', true)
      })
  })
  panel.appendChild(wordButton)

  var html5Label = makeCheckboxLabel('HTML5')
  panel.appendChild(html5Label)

  var html5Check = makeCheckbox()
  panel.appendChild(html5Check)

  var idsLabel = makeCheckboxLabel('IDs')
  panel.appendChild(idsLabel)

  var idsCheck = makeCheckbox()
  panel.appendChild(idsCheck)

  var listsLabel = makeCheckboxLabel('Lists')
  panel.appendChild(listsLabel)

  var listsCheck = makeCheckbox()
  panel.appendChild(listsCheck)

  var htmlButton = document.createElement('button')
  htmlButton.appendChild(document.createTextNode('Download HTML'))
  htmlButton.addEventListener('click', function () {
    try {
      var parsed = commonmark.parse(window.editor.getValue())
    } catch (error) {
      console.error(error)
      return
    }
    var content = html(parsed.form, [], {
      html5: html5Check.checked,
      ids: idsCheck.checked,
      lists: listsCheck.checked
    })
    var blob = new Blob([content], { type: 'text/html' })
    var date = new Date().toISOString()
    FileSaver.saveAs(blob, 'commonform-' + date + '.html', true)
  })
  panel.appendChild(htmlButton)

  var jsonButton = document.createElement('button')
  jsonButton.appendChild(document.createTextNode('JSON'))
  jsonButton.addEventListener('click', function () {
    try {
      var parsed = commonmark.parse(window.editor.getValue())
    } catch (error) {
      console.error(error)
      return
    }
    var json = JSON.stringify(parsed.form)
    var blob = new Blob([json], { type: 'application/json' })
    var date = new Date().toISOString()
    FileSaver.saveAs(blob, 'commonform-' + date + '.json', true)
  })
  panel.appendChild(jsonButton)

  window.editor.addPanel(panel, { position: 'after-top', stable: true })
}

function addLintPanel () {
  var panel = document.createElement('div')
  panel.className = 'panel annotations'

  var editor = window.editor
  editor.on('changes', function () {
    var text = editor.getValue()
    try {
      var parsed = commonmark.parse(text)
    } catch (error) {
      return renderAnnotations([
        {
          message: 'Invalid Syntax',
          severity: 'error'
        }
      ])
    }
    var annotations = []
      .concat(lint(parsed.form))
      .concat(critique(parsed.form))
    renderAnnotations(annotations)
  })

  function renderAnnotations (annotations) {
    panel.innerHTML = ''
    var messagesSeen = []
    var unique = []
    annotations.forEach(function (annotation) {
      var message = annotation.message
      if (messagesSeen.indexOf(message) === -1) {
        messagesSeen.push(message)
        unique.push(annotation)
      }
    })
    if (unique.length === 0) return
    var ul = document.createElement('ul')
    unique.forEach(function (annotation) {
      var li = document.createElement('li')
      li.className = annotation.level
      li.appendChild(document.createTextNode(annotation.message))
      ul.appendChild(li)
      panelObject.changed()
    })
    panel.appendChild(ul)
  }

  var panelObject = window.editor.addPanel(panel, {
    position: 'after-top',
    stable: true
  })
}

function makeSelect (choices) {
  var select = document.createElement('select')
  Object.keys(choices).forEach(function (key) {
    var option = document.createElement('option')
    option.value = key
    option.appendChild(document.createTextNode(choices[key].label))
    select.appendChild(option)
  })
  return select
}

function makeCheckboxLabel (text) {
  var label = document.createElement('label')
  label.appendChild(document.createTextNode(text))
  return label
}

function makeCheckbox () {
  var checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = 'yes'
  return checkbox
}

function addHelpLinks () {
  var p = document.createElement('p')
  p.className = 'links'

  var typeLink = document.createElement('a')
  typeLink.href = 'https://type.commonform.org'
  typeLink.target = '_blank'
  typeLink.appendChild(document.createTextNode('Typing Guide'))
  p.appendChild(typeLink)

  var githubLink = document.createElement('a')
  githubLink.href = 'https://github.com/commonform/edit.commonform.org'
  githubLink.target = '_blank'
  githubLink.appendChild(document.createTextNode('GitHub'))
  p.appendChild(githubLink)

  var emailLink = document.createElement('a')
  emailLink.href = 'mailto:kyle@commonform.org'
  emailLink.appendChild(document.createTextNode('E-Mail Kyle'))
  p.appendChild(emailLink)

  document.getElementById('main').appendChild(p)
}
