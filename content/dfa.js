import { addScene, registerScene } from '../templates/scene.js';
import dfaIntro from '../anims/dfa_intro.js'
import { markComplete } from '../tools/completion.js';
import { addIcon } from '../templates/icons.js';

const contentText = `
<div class="aspect-ratio">
<iframe src="https://www.youtube.com/embed/k9LmFzXPcYM?si=3AQBjp0p4NXKk07L" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<h2>Deterministic Finite Automaton (DFA)</h2>

<img src="/img/dfaIntro/graph1.png" />

Much like Regular Expressions, a DFA is a way to represent a language, but this representation is much closer to an algorithm than it is a description of the language.
It's made up of <span class='highlight highlight-blue'>states</span>, and those states are connected by <span class='highlight highlight-blue'>transitions</span>, which have labels containing letters from the alphabet.
<br>
You've probably seen something similar when playing video games, and interacting with characters with a few basic behaviours.

<img src="/img/dfaIntro/mario.png" />

But DFAs have some particular rules that must be followed. <br>
In a DFA, for every state and every letter in the alphabet, there is exactly one transition that begins at that state, and includes that letter in its label.

<img src="/img/dfaIntro/copy.png" />

A DFA needs two more things to be complete: a single <span class='highlight highlight-green'>start state</span> and a set of <span class='highlight highlight-red'>accepting states</span>.

<img src="/img/dfaIntro/start_final.png" />

<h2>How to use a DFA</h2>

To use the DFA, we provide a word, and place a pointer at the start state.
We then take the first letter in the word, and <span class='highlight highlight-purple'>move</span> the pointer along the transition that starts at our current state and whose label includes that first letter.

<div class="split-page">
<div class="split-img"><img src="/img/dfaIntro/move1.png" /></div>
<div class="split-img"><img src="/img/dfaIntro/move2.png" /></div>
</div>

We know that exactly one such transition exists because of the rule we stated earlier. This is why it's called a <span class='highlight highlight-blue'><b>Deterministic</b></span> Finite Automaton - the next state is determined entirely by the current state and the letter we're reading, so we always end up in the <span class='highlight highlight-purple'>same spot</span>, for the <span class='highlight highlight-purple'>same word</span>.
<br>
Repeating this for all letters in the word, we'll end up in a state. If that state is an <span class='highlight highlight-red'>accepting</span> state, the word is in the language. Otherwise, it is not.

<img src="/img/dfaIntro/moveFinal.png" />

<h2>Formal Definition</h2>

While everything I said above is true, we can be a bit mathematically clearer in our definition, and you might find this useful for proving things about DFAs.

You definitely won't need to memorize this for anything else on this site, but it's good to know.

A DFA is a collection of 5 things:

<ul>
  <li>A set of states, \\(Q\\)</li>
  <li>An alphabet, $\\Sigma$</li>
  <li>A transition function, $\\delta: Q \\times \\Sigma \\rightarrow Q$</li>
  <li>A start state, $q_0 \\in Q$</li>
  <li>A set of accepting states, $F \\subseteq Q$</li>
</ul>

<img src="/img/dfaIntro/formal.png" class="small" />

The transition function enforces the requirement that <span class='highlight highlight-blue-long'>every state/letter pair has exactly one transition</span>.
Essentially a transition from X to Y with label a would be represented as $\\delta(X, a) = Y$.

You could also represent the transition function as a table, similar to the one we showed earlier, except rather than the entires being the transitions, the entries are the states that those transitions point to:

<img src="/img/dfaIntro/transition_map.png" />

<h2>Examples</h2>

Let's look at some basic languages and how we can represent them with a DFA.

<h3>Language 1: Words not starting with 'b' (Alphabet: {a, b})</h3>

We can represent this language with 3 states:

<ul>
  <li>${addIcon('s')}: A state to represent the first character has not yet been read</li>
  <li>${addIcon('a')}: A state to represent the first character has been read, and this character was an 'a'</li>
  <li>${addIcon('b')}: A state to represent the first character has been read, and this character was a 'b'</li>
</ul>

The transitions from ${addIcon('s')} are relatively straight-forward, as we can transition to ${addIcon('a')} on an 'a' and to ${addIcon('B')} on a 'b'.

This is because these first transitions from ${addIcon('s')} are reading the first character of the word, and this first character determines whether we go to state ${addIcon('a')} or state ${addIcon('b')}.

<img src="/img/dfaIntro/e1p1.png" class="small" />

The transitions from ${addIcon('a')} and ${addIcon('b')} are also super-simple. If we read any more characters, that doesn't change the fact that the first character was an 'a' or 'b', so we can just stay in the same state.

Our starting state is ${addIcon('s')}, and our accepting states are ${addIcon('s')} and ${addIcon('a')}, since neither of these represent words starting with 'b'.

<img src="/img/dfaIntro/e1p2.png" class="small" />

<h3>Language 2: Words with an even number of 'a's (Alphabet: {a, b})</h3>

This language is maybe a bit more complex to identify as humans, but the DFA representation is actually quite simple.

We can represent this language with just 2 states:

<ul>
  <li>${addIcon('e')}: A state to represent that the number of 'a's read so far is even</li>
  <li>${addIcon('o')}: A state to represent that the number of 'a's read so far is odd</li>
</ul>

The transitions for the 'b' character are simple - if we read a 'b', the number of 'a's read doesn't change, so we stay in the same state.

<img src="/img/dfaIntro/e2p1.png" class="small" />

The transitions for the 'a' character aren't that much more complicated - if we read an 'a', the number of 'a's read changes <span class='highlight highlight-blue'>parity</span> (Even + 1 = Odd, Odd + 1 = Even), so we transition from ${addIcon('e')} to ${addIcon('o')} and vice versa.
Our start state is the same as our only accepting state - ${addIcon('e')}.

<img src="/img/dfaIntro/e2p2.png" class="small" />

<h2>What's next?</h2>

As you can see, some languages are much easier to define with regular expressions, whereas in other cases they're easier to define as Deterministic Finite Automata.

<img src="/img/dfaIntro/compare.png" />

In these next few worksheets, let's explore the limits of Deterministic Finite Automata, how to use them, and how to create them ourselves.
`

const addContent = () => {
  /*addScene('video', document.querySelector('.articleBodyCenter'));
  registerScene(dfaIntro.loader, dfaIntro.unloader, 'video', undefined, () => {
    markComplete('dfaIntro');
  });*/
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
}

export default addContent;
