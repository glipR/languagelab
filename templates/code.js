window.showTab = {}
window.getCode = {}
window.currentTab = {}
window.editors = {}

const showName = {
  'JS': 'JavaScript',
  'Py': 'Python',
}

const langName = {
  'JS': 'javascript',
  'Py': 'python',
}

const addCode = (id, templates) => {
  const div = document.createElement("div");
  div.classList.add('code-container')
  div.id = `${id}-container`;
  div.innerHTML = `\
  <div class="tab-view" id="${id}-tabs">
    ${Object.keys(templates).map(lang => `\
    <button class="tab" id="${id}-tab-${lang}" onclick="showTab['${id}']('${lang}')">${showName[lang]}</button>`
    ).join('')}
  </div>
  <div id="${id}-codes" class="codes">
    ${Object.entries(templates).map(([lang, code]) => `\
    <div class="editor" id="${id}-code-${lang}" style="display: none">${localStorage.getItem(id + "-" + lang) || code}</div>`
    ).join('')}
  </div>
  `;

  document.querySelector('.articleBodyCenter').appendChild(div);

  window.showTab[id] = (lang) => {
    const tabs = document.querySelectorAll(`.tab-view#${id}-tabs .tab`);
    tabs.forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll(`#${id}-codes .editor`).forEach(e => e.style.display = 'none');
    document.getElementById(`${id}-code-${lang}`).style.display = 'block';
    document.querySelector(`#${id}-tab-${lang}`).classList.add('active');
    window.currentTab[id] = lang;
  }
  window.currentTab[id] = Object.keys(templates)[0];

  window.editors[id] = {};

  window.langTools = ace.require("ace/ext/language_tools");
  Object.entries(templates).forEach(([lang, code]) => {
    window.editors[id][lang] = ace.edit(`${id}-code-${lang}`);
    window.editors[id][lang].setOptions({
      enableBasicAutocompletion: false,
      enableSnippets: true,
      enableLiveAutocompletion: true,
  });
    window.editors[id][lang].setTheme("ace/theme/monokai");
    window.editors[id][lang].session.setMode(`ace/mode/${langName[lang]}`);
    window.editors[id][lang].session.on('change', () => {
      localStorage.setItem(`${id}-${lang}`, window.editors[id][lang].getValue());
    });
    window.showTab[id](Object.keys(templates)[0]);
  });

  window.getCode[id] = () => {
    return window.editors[id][window.currentTab[id]].getValue();
  }

}

export default addCode;
