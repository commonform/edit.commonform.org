var CodeMirror = require('codemirror')

document.addEventListener('DOMContentLoaded', function () {
  addEditor()
  addHelpLinks()
})

function addEditor () {
  var editor = CodeMirror(document.getElementById('main'), {
    autofocus: true,
    spellcheck: true,
    lineWrapping: true,
    mode: require('codemirror/mode/markdown/markdown')
  })
  editor.setValue('# Welcome')
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
