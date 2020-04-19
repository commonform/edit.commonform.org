var commonmark = require('commonform-commonmark')
var critique = require('commonform-critique')
var lint = require('commonform-lint')

var CodeMirror = require('codemirror')
require('codemirror/mode/markdown/markdown')
require('codemirror/addon/lint/lint')

document.addEventListener('DOMContentLoaded', function () {
  configureLinters()
  addEditor()
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
  var editor = CodeMirror(document.getElementById('main'), {
    autofocus: true,
    spellcheck: true,
    lineWrapping: true,
    mode: 'markdown',
    gutters: ['CodeMirror-lint-markers'],
    lint: true
  })
  editor.setValue('# Welcome')
  editor.on('changes', function () {
  })
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
