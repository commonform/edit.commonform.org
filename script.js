var FileSaver = require('file-saver')
var commonmark = require('commonform-commonmark')
var critique = require('commonform-critique')
var docx = require('commonform-docx')
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

var CodeMirror = require('codemirror')
require('codemirror/mode/markdown/markdown')
require('codemirror/addon/lint/lint')
require('codemirror/addon/display/panel')

document.addEventListener('DOMContentLoaded', function () {
  configureLinters()
  addEditor()
  addPanel()
  addHelpLinks()
})

function configureLinters () {
  CodeMirror.registerHelper('lint', 'markdown', function (text, options) {
    var from = CodeMirror.Pos(0 /* line */, 0 /* column */)
    var to = CodeMirror.Pos(0, 0)
    try {
      var parsed = commonmark.parse(text)
    } catch (error) {
      return [
        {
          from: from,
          to: to,
          message: 'Invalid Syntax',
          severity: 'error'
        }
      ]
    }
    var messages = []
      .concat(lint(parsed.form))
      .concat(critique(parsed.form))
      .map(function (annotation) {
        return {
          from: from,
          to: to,
          message: annotation.message,
          severity: annotation.level
        }
      })
    return messages
  })
}

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
      value: '# Welcome'
    }
  )
}

function addPanel () {
  var panel = document.createElement('div')
  panel.id = 'panel'

  var wordButton = document.createElement('button')
  wordButton.appendChild(document.createTextNode('Download for Word'))
  wordButton.addEventListener('click', function () {
    var options = {
      centerTitle: false,
      indentMargins: true,
      markFilled: true,
      numbering: numberings[numberingSelect.value].numbering,
      styles: {
        alignment: 'left',
        heading: { italic: true },
        reference: { italic: true },
        referenceHeading: { italic: true }
      }
    }
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

  var numberingSelect = document.createElement('select')
  Object.keys(numberings).forEach(function (key) {
    var option = document.createElement('option')
    option.value = key
    option.appendChild(document.createTextNode(numberings[key].label))
    numberingSelect.appendChild(option)
  })
  panel.appendChild(numberingSelect)

  window.editor.addPanel(panel, { position: 'after-top', stable: true })
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

  document.getElementById('main').appendChild(p)
}
