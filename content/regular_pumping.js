import { addIcon } from '../templates/icons.js';
import { wrapColour, highlight } from '../templates/colours.js';
import { blue, red } from '../colours.js';

const contentText = `
<div class="aspect-ratio">
<iframe src="https://www.youtube.com/embed/ghijz3XPRRQ?si=ixp0wtT-1IKNA3QJ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<h2>Looking at property #2</h2>

In the last page, we mentioned two properties of regular languages:

<ul>
  <li>Regular Languages have a finite number of states</li>
  <li>Regular Languages require looping to recognise words of a certain length</li>
</ul>

Previously, we covered the first property, and from that we were able to learn a lot about another way to view regular languages, as well as an algorithm for minimising our DFAs that we probably couldn't have come up with without that viewpoint.

On this page, we'll be scrutinising the second property, and we'll see what we can glean from it.

<h3>What is this property, exactly?</h3>

For non-finite languages, Regular Language mechanisms need loops to recognise words of a certain length. But before we continue, let's drill down on exactly why this is, and what it implies.

Just as with the first property, since our language is regular, we'll look at a DFA that recognises it, since this form is very well structured, and easy to prove things about.

Take any DFA (and therefore any regular language), and consider a word that is accepted by this DFA,
where the number of characters is at least the number of states in the DFA, $n$.

<img src="/img/regularPump/dfa.png">

Let's look at the path taken by this word on our DFA:

<img src="/img/regularPump/path.png">

Notice that in reading the first $n$ characters of the word, we will visit $n+1$ states (since we visit a state before reading any characters).
Therefore, there must be at least one state that is ${highlight('visited twice or more', 'purple', true, true)} in the first $n$ characters being read.

This corresponds to some substring of the first $n$ characters in the word:

<img src="/img/regularPump/partition.png">

which goes from ${addIcon('b')} to ${addIcon('b')}, and so knowing such a path exists as part of our word allows us to generate an infinite family of words that also must be in the language.

If we split our original word into three parts, ${highlight('$x$', 'green', true)} being the string before our loop, ${highlight('$y$', 'purple', true)} being the loop itself, and ${highlight('$z$', 'orange', true)} being the string after the loop,
then we can generate words in the language by starting with $x$, repeating some amount of $y$ strings, and then capping it off with a $z$ string.

<img src="/img/regularPump/repeat.png">

This property, that we need to be able to find some repeatable string in the first $n$ characters, is surprisingly good at separating regular languages from many irregular languages.

Let's write out formally what we've just shown is true:

<div class="definitionBlock">
  <h3>Pumping Lemma for Regular Languages</h3>
  If $R$ is a regular language, then there exists some integer $n$ such that
  for all words $w$ accepted by $R$ with $|w| \\geq n$,
  there exists a partitioning of $w = xyz$ such that:
  <ul>
    <li>$|y| \\neq 0$</li>
    <li>$|xy| \\leq n$</li>
  </ul>
  and for all $i \\geq 0$, $xy^iz$ is accepted by $R$.
</div>

<h3>The pumping game</h3>

Personally it helps me to think about this lemma as a game, played between two players as follows:

<ol>
  <li>A non-finite language is chosen between the two players</li>
  <li>Player 1 provides an integer, $n$</li>
  <li>Player 2 provides a word $w$ which is accepted by the language and whose length is at least $n$</li>
  <li>Player 1 provides a partitioning of $w$ into three parts $xyz$, where $xy$ has length at most $n$ and $y$ is non-empty</li>
  <li>Player 2 picks some non-negative integer $i$</li>
  <li>If $xy^iz$ is in the language, Player 1 wins. Otherwise Player 2 wins.</li>
</ol>

The pumping lemma essentially states that for regular languages, there is a strategy for Player 1 to always win this game,
and in the text before we described exactly what this strategy was:

<ul>
  <li>Our language is Regular, so it has a DFA that recognises it. Pick one.</li>
  <li>Choose $n$ equal to the number of states in our DFA.</li>
  <li>Player 2 then ${highlight('has to', 'green', true)} respond with a word that meets the same state twice in the first $n$ characters.</li>
  <li>Identify these states, and use this to partition the word into $xyz$</li>
  <li>Player 2 will respond with some $i$, but because $y$ represents a path from a state to itself, ${highlight('no matter what', 'green', true, true)}, the word will be accepted!</li>
</ul>

<h3>When it isn't true?</h3>

We've just shown a property that must hold true for Regular Languages. So if we wanted to show a language was ${highlight('not', 'red', true)} regular, we could prove the property is false! What does this imply?

Well, the game analogy from earlier might prove fruitful in determining what exactly this means.

The game is played between two players, with no random elements, and no draws.
So when played perfectly, either Player 1 will win or Player 2 will win.
In other words, if there is no winning strategy for Player 1, then there must exist a winning strategy for Player 2.

What does this look like?

<ul>
  <li>No matter what value for $n$ Player 1 chose,</li>
  <li>There is always a word $w$ Player 2 can choose, such that</li>
  <li>No matter what partitioning Player 1 chooses,</li>
  <li>There is some $i$ Player 2 can choose, such that</li>
  <li>$xy^iz$ is ${highlight('not', 'red', true)} in the language.</li>
</ul>

We can use this to rephrase our Pumping Lemma:

<div class="definitionBlock">
  <h3>Pumping Lemma for Regular Languages (alt)</h3>
  Take some language $R$.
  If for all integer $n$, there exists a word $w$ accepted by $R$ with $|w| \\geq n$, such that
  for all partitionings of $w = xyz$ satisfying:
  <ul>
    <li>$|y| \\neq 0$</li>
    <li>$|xy| \\leq n$</li>
  </ul>
  there must be some $i \\geq 0$, such that $xy^iz$ is ${highlight('rejected', 'red')} by $R$.

  Then $R$ must be irregular.
</div>

We can also get this same statement by negating our original lemma and using some logic rules (and I would encourage you at home to try this).

<h3>An example</h3>

Let's use our newfound tool to ${highlight('prove', 'green', true)} that a language is irregular, that a language ${highlight('can never', 'red')} be represented by a DFA.

One thing we've had trouble doing with DFAs is requiring two parts of a string to be equal, so let's consider the language of all words with an equal amount of a's and b's, and we'll try to show that Player 2 can always win the game.

The first move is Player 1's, and they will respond with some number $n$.

As Player 2, we can then respond with the word $a^nb^n$. This has an equal amount of a's and b's, and is double the length requirement.

Player 1 then responds with some partitioning of $w$ into $xyz$. But, because of the word we've chosen, and the restrictions on the partition, we know a few things:

<ol>
  <li>Because $|xy|\\leq n$, we know that the first two elements of the partition are contained entirely in the $a^n$ section.</li>
  <li>Because $|y| \\neq 0$, we then know that $y$ is some non-zero amount of a's.</li>
</ol>

As such, as Player 2, we can simply pick $i=0$ (But really, any $i \\neq 1$). $xy^iz$ will then have an unequal amount of a's and b's, and the word is therefore rejected by the language.

A formal proof of the irregularity of this language looks no different, except 'Player 1' and 'Player 2' are replaced with 'for all's and 'there exists's everywhere:

<div class="definitionBlock">
  <h3>Proof that #a's=#b's is irregular.</h3>
  For any $n \\geq 0$, consider the word $w = a^nb^n$. This has an equal amount of a's and b's, and $|w| \\geq n$.
  For any partitioning of $w$, we know that:
  <br>

  <ol style="margin: 20px 0px;">
    <li>Because $|xy|\\leq n$, we know that the first two elements of the partition are contained entirely in the $a^n$ section.</li>
    <li>Because $|y| \\neq 0$, we then know that $y$ is some non-zero amount of a's.</li>
  </ol>

  As such, for $i=0$, $xy^iz$ will have an unequal amount of a's and b's, and the word is therefore rejected by the language.
  <br><br>
  Therefore, the language of words with an equal amount of a's and b's is irregular.
</div>

Notice that our word choice mattered there. If instead we selected $w = (ab)^n$, then a partitioning of $x$ = 'ε', $y$ = 'ab', and $z$ = $(ab)^{n-1}$ would've secured the win for Player 1.

We are proving that there ${highlight('exists', 'blue', true)} a strategy that wins for Player 2, not that Player 2 ${highlight('always', 'blue', true)} wins.

<h3>Tips for using the Pumping lemma</h3>

This is probably the hardest part of regular languages, so let's review some tips and tricks for how to use this lemma effectively:

<ul>
  <li>Don't forget that $i=0$ is an option - we can remove the $y$ element entirely. Sometimes this choice is the only way to prove irregularity.</li>
  <li>Some languages are irregular, but do satisfy the pumping lemma. We've just shown that no pumping lemma implies irregularity, but not the other way around.</li>
  <li>Often your word choice is exploiting some 'asymmetry' in first $n$ characters of the word. Notice how in our example, we needed the a's to equal the b's, but we forcefully chose the first $n$ characters to only have a's, so any partitioning would force this out of wack.</li>
  <li>Sometimes, there are multiple choices for valid words that Player 2 can win with, however one will be a lot easier to prove is a winning strategy. Try to make your $n$ character segment as simple as possible!</li>
  <li>It is hard to choose the right word, but this is something that requires intution and gets better with practice. So let's get some practice on the next two worksheets!</li>
</ul>
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
}

export default addContent;
