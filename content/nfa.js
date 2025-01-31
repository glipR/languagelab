import { addIcon } from '../templates/icons.js';

const contentText = `
<div class="aspect-ratio">
<iframe src="https://www.youtube.com/embed/qXSOMLpmuEM?si=GK9uZhb7H2_lP2eP" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<h2>Non-Deterministic Finite Automaton (NFA)</h2>

A non-deterministic finite automaton looks a lot like a DFA, but breaks some key rules.

First off, the requirement for there to be exactly one transition, per state and character pairing, is gone.

So you could have multiple 'a' transitions starting at a state, or none.

<div class="split-page">
<div class="split-img"><img style="max-height: 300px; width: unset;" src="/img/nfaIntro/rule-1.png"/></div>
<div class="split-img"><img style="max-height: 300px; width: unset;" src="/img/nfaIntro/rule-2.png"/></div>
</div>

Additionally, NFAs allow a new kind of transition that we'll label with the Greek letter <span class='highlight highlight-green'>epsilon</span>, these epsilon transitions function like normal, but when moving across them, no character is read.

<img src="/img/nfaIntro/rule-3.png"/>

So for the word 'aab' above, we can move from ${addIcon('1')} to ${addIcon('2')}, and ${addIcon('2')} to ${addIcon('2')}, then ${addIcon('2')} to ${addIcon('3')} (which reads nothing), then ${addIcon('3')} to ${addIcon('4')}.

That's all the difference! NFAs are like DFAs, but they can have less edges in some cases, more edges in others, and they don't always read a character when moving along an edge.

<h3>What do NFAs accept?</h3>

<img src="/img/nfaIntro/double-edge.png"/>

This causes a problem for our DFA algorithm though, there isn't always one path to take to read a particular word!

To resolve this non-determinism, we define an NFA to accept a word if there <span class='highlight highlight-red'>exists</span> a path in the NFA which reads all characters in the word, and ends on an accepting state.

In this example, we've got multiple paths to take.

Some read the whole word, but don't end on an accepting state:

<img src="/img/nfaIntro/path-1.png"/>

Some don't even succeed in reading the whole word, and crash early because no transitions are available:

<img src="/img/nfaIntro/path-2.png"/>

But since we have a path, which does read the entire word <span class="highlight-small highlight-green">and</span> ends on an accepting state - we accept the word:

<img src="/img/nfaIntro/path-3.png"/>

<h3>What can we do with NFAs?</h3>

NFAs make defining certain things much less tedious than it was in DFAs, and they might even let us define new languages!

For example take the language of words not starting with 'b', that we've seen earlier. Previously it was defined like this.

<img src="/img/nfaIntro/dfa-1.png"/>

Where even though we don't care what happens after reading the first 'b', we still need the transition in pink.

In an NFA, we don't need this, but we can go further and remove the option of reading 'b' entirely.

<img class="small" src="/img/nfaIntro/nfa-1.png"/>

A cool use of epsilon transitions is in the language of alphabetically ordered strings.

Previously, we needed to handle any change in letters, from 'a' to 'b', 'a' to 'c', 'b' to 'd', 'c' to 'd', and so on.

<img src="/img/nfaIntro/dfa-2.png"/>

But in an NFA, we can do this!

<img src="/img/nfaIntro/nfa-2.png"/>

For any alphabetic string, we can read the word by just taking the loop transition, and only taking the epsilons when you've exhausted the previous letter.

Epsilons essentially allow your NFA to <span class='highlight highlight-blue'>decide</span> when its best to change state.
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
}

export default addContent;
