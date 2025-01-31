import { addIcon } from '../templates/icons.js';
import { highlight } from '../templates/colours.js';

const contentText = `
<div class="aspect-ratio">
<iframe src="https://www.youtube.com/embed/V3ydGFtbni4?si=sD3CZ0T4L_rtxza_" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<h2>It's all connected</h2>

In the last page, we looked at variations of non-deterministic finite automata that are equivalent to NFAs (and by extension DFAs).

Let's continue these efforts, and try to think abot how we might prove that allowing each transition in our NFA to be a <span class="highlight-small highlight-orange-long">regular expression</span> instead of a single symbol doesn't change the power of the machine.

<h3>Regular expressions to NFAs</h3>

For a particular regular expression, if we can find an NFA that accepts the same language, then plugging this NFA in-place of an transition is rather simple:

<div class="split-page" style="align-items: flex-end;">
  <div class="split-img"><img src="/img/regularConversion/simpleNFA.png"/></div>
  <div class="split-img"><img src="/img/regularConversion/simpleNFAConverted.png"/></div>
</div>

So let's try converting a regular expression to an NFA. Just as how we understood Regular Expressions originally, let's ${highlight('break apart and simplify', 'green', true, true)} the regular expression into smaller parts, and keep going until our transitions are just singular symbols.

<img src="/img/regularConversion/example1.png" />

First, we can break down the regular expression into constituent parts, which need to be read in sequence:

<img src="/img/regularConversion/example2.png" />

Take the first part, '(ab)*'. The regex accepts any number of 'ab' pairs. We can represent this as a simple NFA:

<img src="/img/regularConversion/example3.png" style="max-height: 40vh" />

We can then embed this in the larger NFA, using epsilon transitions to connect the previous and next states:

<img src="/img/regularConversion/example4.png" />

Next is the (a*b)|(b*a) part. Again, we can break this down into smaller parts, and make NFAs for each of the sub-expressions:

<img src="/img/regularConversion/example5.png" />

Then to form the pipe, simply use a new starting and accepting state, and use epsilon transitions to allow one of the paths to be chosen:

<img src="/img/regularConversion/example6.png" />

Finally, we can connect all the parts together:

<img src="/img/regularConversion/example7.png" />

And we've got our NFA!

That's it really, we can convert <span class="highlight-small highlight-purple-long">Regular Expressions to NFAs</span>, by using the following three rules:

<img src="/img/regularConversion/3rules.png" />

<h3>Can we go the other way?</h3>

We've shown that:

<ul>
  <li>NFAs and DFAs are equivalent (They can accept the same languages)</li>
  <li>Regular expressions are at most as powerful as NFAs (Any language accepted by a regular expression can be represented by an NFA)</li>
</ul>

But are they <span class="highlight highlight-blue">equivalent</span>? Can we convert an NFA or DFA to a regular expression?

Take the previous example of NFAs that allowed regular expressions on their transitions.
Rather than trying to break apart these transitions into characters, let's go the other direction and try to ${highlight('compress', 'blue', true)} the entire NFA into a single transition.

We can do this with two main operations:

<ul style="list-style-type: decimal;">
  <li>Consolidating transitions</li>
  <li>Removing states</li>
</ul>

<h3>Consolidating transitions</h3>

If we have two states ${addIcon('a')} and ${addIcon('b')} with multiple transitions between them, we can consolidate these transitions into a single transition, and join the labels with a pipe.

<div class="split-page">
  <div class="split-img"><img src="/img/regularConversion/preMerge.png"/></div>
  <div class="split-img"><img src="/img/regularConversion/postMerge.png"/></div>
</div>

<h3>Removing states</h3>

This is the much more complicated step.

Let's say we have some state which is not the starting state, and not accepting, and we want to remove it from the NFA.

This state could have both incoming and outgoing transitions, as well as loop transitions on the state itself.

<img src="/img/regularConversion/removeGraph.png"/>

To remove this state, we need to add additional transitions to the rest of the NFA, which essentially 'simulate' moving through this state.

Any path which goes through this state must use both an incoming and outgoing transition, since we didn't start or end on this state, and the path has the option of taking the loop transition 0 or more times.

But we can write this as a <span class="highlight-small highlight-green-long">regular expression!</span> X(Y)*Z represents reading X, then any number of Y, then Z.

So, to simulate all possible paths through this state, we can simply:

<ul style="list-style-type: decimal;">
  <li>Take every possible pairing of incoming and outgoing transitions</li>
  <li>Create the regular expression representing the incoming transition, loop transition repeated, then outgoing transition</li>
  <li>Set the start and end of this transition to be the start of the incoming transition and the end of the outgoing transition</li>
</ul>

<div class="split-page">
  <div class="split-img"><img src="/img/regularConversion/removeTable.png"/></div>
  <div class="split-img"><img src="/img/regularConversion/removeResult.png"/></div>
</div>

What happens if we do this for all non-starting, non-accepting states? We'll be close to our goal, but not quite - we could have a few different accepting states, with transitions between eachother.

But to fix this, we can consolidate our accepting states into a single one using epsilon transitions, and then use our technique we just covered.

<img src="/img/regularConversion/combineAccept.png"/>

This means that after executing our algorithm the starting and accepting states can be in one of two configurations:

If the starting state is the accepting state, then we've only got a single state and one loop transition.
<br>
${highlight('Sounds like a job for the kleene star!', 'green', false, true)}

<img class="small" src="/img/regularConversion/finalStep1.png"/>

Otherwise, we've got a distinct start state and accepting state, with a transition between them, and maybe some loops on either state. This is also pretty simple to write as a regular expression!

<div class="split-page">
  <div class="split-img"><img src="/img/regularConversion/finalStep2.png"/></div>
  <div class="split-img"><img src="/img/regularConversion/finalStep3.png"/></div>
</div>

So we can convert freely between NFAs, Regular Expressions, and DFAs, and so therefore all three of the structures we've looked at so far are <span class="highlight highlight-blue">equivalent</span>.
This is a pretty neat fact, don't you think?

Regular expressions and Finite Automata use completely different approaches and structures to represent languages, but ultimately their abilities are the same.

Since this result is so special, the languages recognised by these machines are given a name - <span class="highlight-small highlight-green-long">Regular Languages</span>!

Now that we have multiple ways to represent Regular Languages,
and have a good grasp of how they are generated,
we're finally ready to prove some really neat properties of Regular Languages,
which is what this section is all about!
`


const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
}

export default addContent;
