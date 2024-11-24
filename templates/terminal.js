export function addTerminal() {
  const terminal = document.createElement("div");
  terminal.classList.add("terminal");
  terminal.id = "terminal";
  terminal.style.display = "none";
  const terminalLineContainer = document.createElement("div");
  terminalLineContainer.classList.add("terminal-line-container");
  terminalLineContainer.id = "terminal-line-container";
  terminal.appendChild(terminalLineContainer);
  const clear = document.createElement("button");
  clear.classList.add("terminal-clear");
  clear.addEventListener("click", clearTerminal);
  terminal.appendChild(clear);
  document.querySelector('.articleBodyCenter').appendChild(terminal);
}

export function newLog(method='log') {
  const oldLog = console.log;
  const oldError = console.error;
  return function message(...args) {
    if (method === 'error') oldError(...args);
    if (method === 'log') oldLog(...args);
    const terminal = document.getElementById("terminal-line-container");
    const log = document.createElement("div");
    log.classList.add("terminal-line");
    log.classList.add(method);
    log.innerHTML = args.join(" ").replaceAll("\n", "<br>");
    terminal.appendChild(log);
    document.getElementById("terminal").style.display = "block";
  }
}

export function clearTerminal() {
  const terminal = document.getElementById("terminal");
  terminal.querySelectorAll(".terminal-line").forEach(line => line.remove());
  terminal.style.display = "none";
}

export default addTerminal;
