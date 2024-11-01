import { addScene, registerScene } from '../templates/scene.js';
import dfaCategorise from '../anims/dfa_categorise.js';
import { t1JSON, t2JSON, t3JSON, t4JSON } from '../graphs/dfaValidate.js'
import { StepScenes } from '../utils.js';
import { markComplete } from '../tools/completion.js';

const t2Tasks = [{
  graph: t1JSON,
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "bab", category: "Accepted" },
    { value: "a", category: "Rejected" },
    { value: "abbbaaab", category: "Accepted" },
    { value: "baa", category: "Rejected" },
  ]
}, {
  graph: t2JSON,
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "baabaa", category: "Accepted" },
    { value: "bbaa", category: "Rejected" },
    { value: "bababa", category: "Rejected" },
    { value: "aaa", category: "Rejected" },
    { value: "babaaaa", category: "Accepted" },
  ]
}, {
  graph: t3JSON,
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "abba", category: "Rejected" },
    { value: "aabb", category: "Rejected" },
    { value: "abbbb", category: "Accepted" },
    { value: "baa", category: "Accepted" },
  ]
}, {
  graph: t4JSON,
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "haaah", category: "Accepted" },
    { value: "haaha", category: "Rejected" },
    { value: "aaaaaa", category: "Accepted" },
    { value: "aaahaaaaa", category: "Rejected" },
  ]
}];

const contentText = `
Look at the following DFAs and write down a simple English sentence which describes the words that are accepted by the DFA.
<br/>
Then, drag the words into the accepted/rejected categories.
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
  addScene('dfa_validate', document.querySelector('.articleBodyCenter'));
  const categoryContainer = document.querySelector('#dfa_validate');
  const t2Steps = new StepScenes(categoryContainer, "dfa_validate", t2Tasks, () => {
    markComplete('dfaCategorise');
  }, true, null, { storageKey: 'dfaValidateProgress' });
  registerScene(dfaCategorise.loader, dfaCategorise.unloader, 'dfa_validate', t2Tasks[t2Steps.progress.current], t2Steps.makeOnSuccess(), t2Steps.makeOnFailure());
}

export default addContent;
