import { addScene, registerScene } from '../templates/scene.js';
import dfaCategorise from '../anims/dfa_categorise.js';
import { t1JSON, t2JSON, t3JSON, t4JSON } from '../graphs/nfaCategorise.js'
import { StepScenes } from '../utils.js';
import { markComplete } from '../tools/completion.js';

const categoriseTasks = [{
  graph: t1JSON,
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "baaab", category: "Rejected" },
    { value: "bbaab", category: "Accepted" },
    { value: "babab", category: "Accepted" },
    { value: "bbbab", category: "Rejected" },
  ],
  exampleDescription: "Words containing 3 b's, with any (or no) number of a's in between them.",
}, {
  graph: t2JSON,
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "hitihabab", category: "Accepted" },
    { value: "habh", category: "Rejected" },
    { value: "habti", category: "Rejected" },
    { value: "hi", category: "Accepted" },
  ],
  exampleDescription: "Repeated use of hi(ti) or hab(ab), where the bracketed terms can be repeated 0 or more times."
}, {
  graph: t3JSON,
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "1ab2aabb", category: "Accepted" },
    { value: "3aab", category: "Rejected" },
    { value: "ε", category: "Accepted" },
    { value: "3aaab2aa1a", category: "Accepted" },
    { value: "b", category: "Rejected" },
  ],
  exampleDescription: "Repetitions of numbers 1-3, with that many a's following directly after. After each number sequence, there can be any number of b's."
}, {
  graph: t4JSON,
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "haah", category: "Rejected" },
    { value: "hhaaaaah", category: "Accepted" },
    { value: "aaaaaaaaaaaa", category: "Accepted" },
    { value: "hhh", category: "Accepted" },
    { value: "haaaaaahh", category: "Rejected" },
  ],
  exampleDescription: "ahahahaha, but the a's can replaced with any amount of a's, provided that number is 0, or can be expressed as 5x + 7y, where x and y are non-negative integers.",
}];

const contentText = `
Look at the following NFAs and write down a simple English sentence which describes the words that are accepted by the NFA.
<br/>
Then, drag the words into the accepted/rejected categories.
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
  addScene('nfa_categorise', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  const categoryContainer = document.querySelector('#nfa_categorise');
  const t2Steps = new StepScenes(categoryContainer, "nfa_categorise", categoriseTasks, () => {
    markComplete('nfaCategorise');
    // Redirect to next page
    window.location.href = "/pages/nfa_match";
  }, true, null, { storageKey: 'nfaCategoriseProgress' });
  registerScene(dfaCategorise.loader, dfaCategorise.unloader, 'nfa_categorise', categoriseTasks[t2Steps.progress.current], t2Steps.makeOnSuccess(), t2Steps.makeOnFailure());
}

export default addContent;
