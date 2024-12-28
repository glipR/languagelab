import { addScene, registerScene } from '../templates/scene.js';
import regexCategorise from '../anims/regex_categorise.js';
import { StepScenes } from '../utils.js';
import { markComplete } from '../tools/completion.js';

const t2Tasks = [{
  regex: "(abc)*(b+c+)|a",
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "ba", category: "Rejected" },
    { value: "abca", category: "Accepted" },
    { value: "bbccc", category: "Accepted" },
    { value: "abcabcaaa", category: "Rejected" },
  ],
}, {
  regex: "ba+b(b+)|aa*",
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "baba", category: "Accepted" },
    { value: "babb", category: "Accepted" },
    { value: "ba", category: "Rejected" },
    { value: "bababa", category: "Rejected" },
    { value: "babbbbaaa", category: "Accepted" },
  ],
}, {
  regex: "((a*)|(b*))*((cd)|c)*",
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "abababbadc", category: "Rejected" },
    { value: "abbbccddccd", category: "Rejected" },
    { value: "bbacdcccd", category: "Accepted" },
    { value: "ε", category: "Accepted" },
    { value: "aaacdccc", category: "Accepted" },
  ],
}, {
  regex: "((1|2|3|4)(0|1|2|3|4|5|6|7|8|9)*)|0",
  categories: ["Accepted", "Rejected"],
  data: [
    { value: "0", category: "Accepted" },
    { value: "010", category: "Rejected" },
    { value: "402", category: "Accepted" },
    { value: "523", category: "Rejected" },
    { value: "ε", category: "Rejected" },
  ],
}];

const contentText = `
Look at the following Regular Expressions and drag the words into the accepted/rejected categories.
<br>
Remember that the character 'ε' represents the empty string (i.e. is this regex accepting of an empty string?).
<br>
Additionally, we are allowing regex to include an extra symbol '+' to represent <span class="highlight-small highlight-blue">one</span> or more of the preceding character, this is done purely to simplify the expressions.

So 'aa*' is equivalent to 'a+'.
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
  addScene('regex_categorise', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  const categoryContainer = document.querySelector('#regex_categorise');
  const t2Steps = new StepScenes(categoryContainer, "regex_categorise", t2Tasks, () => {
    markComplete('regexClassify');
    // Redirect to next page
    window.location.href = "/pages/regex_match";
  }, true, null, { storageKey: 'regexClassifyProgress' });
  registerScene(regexCategorise.loader, regexCategorise.unloader, 'regex_categorise', t2Tasks[t2Steps.progress.current], t2Steps.makeOnSuccess(), t2Steps.makeOnFailure());
}

export default addContent;
