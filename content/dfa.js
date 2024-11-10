import { addScene, registerScene } from '../templates/scene.js';
import dfaIntro from '../anims/dfa_intro.js'
import { markComplete } from '../tools/completion.js';

const contentText = `
<h2>Deterministic Finite Automaton (DFA)</h2>

<img src="/img/basic-dfa.png" />

<p>
A deterministic finite automaton is an algorithm for determining if a particular word is in a language.
It's made up of <span class='highlight highlight-blue'>states</span>, and those states are connected by <span class='highlight highlight-blue'>transitions</span>, which have labels containing letters from the alphabet.
<br>
In a DFA, every state has exactly one transition for each letter in the alphabet of words you are considering.</p>

<img src="/img/table.png" />

<p>A DFA needs two more things to be complete: a single <span class='highlight highlight-green'>start state</span> and a set of <span class='highlight highlight-red'>accepting states</span>.</p>

<img src="/img/start-accept.png" />

<h2>How to use a DFA</h2>

To use the DFA, you provide a word, and place a pointer at the start state.
You then take the first letter in the word, and <span class='highlight highlight-purple'>move</span> the pointer along the transition that starts in our current state and has that letter as its label.

<div class="split-page">
<div class="split-img"><img src="/img/1st-move.png" /></div>
<div class="split-img"><img src="/img/2nd-move.png" /></div>
</div>

Repeating this for all letters in the word, you'll end up in a state. If that state is an <span class='highlight highlight-red'>accepting</span> state, the word is in the language. Otherwise, it is not.

<img src="/img/final-location.png" />

<h2>Formal Definition</h2>

While everything I said above is true, we can be a bit mathematically clearer in our definition, and you might find this useful for proving things about DFAs:

A DFA is a collection of 5 things:

<ul>
  <li>A set of states, \\(Q\\)</li>
  <li>An alphabet, $\\Sigma$</li>
  <li>A transition function, $\\delta: Q \\times \\Sigma \\rightarrow Q$</li>
  <li>A start state, $q_0 \\in Q$</li>
  <li>A set of accepting states, $F \\subseteq Q$</li>
</ul>

The transition function enforces the requirement that <span class='highlight highlight-blue-long'>every state/letter pair has exactly one transition</span>.
Essentially an arrow from X to Y with letter a would be represented as $\\delta(X, a) = Y$.

<h2>Examples</h2>

Let's look at some basic languages and how we can represent them with a DFA.

<h3>Language 1: Words not starting with 'b'</h3>

We can represent this language with 3 states:

<ul>
  <li>$S$: A state to represent the first character has not yet been read</li>
  <li>$A$: A state to represent the first character has been read, and this character was an 'a'</li>
  <li>$B$: A state to represent the first character has been read, and this character was a 'b'</li>
</ul>

The transitions from S are relatively straight-forward, as we can transition to A on an 'a' and to B on a 'b'.

<img src="/img/e1-p1.png" />

The transitions from A and B are also super-simple. If we read any more characters, that doesn't change the fact that the first character was an 'a' or 'b', so we can just stay in the same state.

Our starting state is S, and our accepting states are S and A, since neither of these represent words starting with 'b'.

<img src="/img/e1-p2.png" />

<h3>Language 2: Words with an even number of 'a's</h3>

This language is a bit more complex to identify as humans, but the DFA representation is actually quite simple.

We can represent this language with just 2 states:

<ul>
  <li>$E$: A state to represent the number of 'a's read so far is even</li>
  <li>$O$: A state to represent the number of 'a's read so far is odd</li>
</ul>

The transitions for the 'b' character are simple - if we read a 'b', the number of 'a's read doesn't change, so we stay in the same state.

<img src="/img/e2-p1.png" />

The transitions for the 'a' character aren't that much more complicated - if we read an 'a', the number of 'a's read changes <span class='highlight highlight-blue'>parity</span> (Even + 1 = Odd, Odd + 1 = Even), so we transition from E to O and vice versa.
Our start state is the same as our only accepting state - E.

<img src="/img/e2-p2.png" />
`

const addContent = () => {
  addScene('video', document.querySelector('.articleBodyCenter'));
  registerScene(dfaIntro.loader, dfaIntro.unloader, 'video', undefined, () => {
    markComplete('dfaIntro');
  });
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
}

export default addContent;
