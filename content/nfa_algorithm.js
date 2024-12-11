import { addIcon } from '../templates/icons.js';

const contentText = `
<div class="aspect-ratio">
<iframe src="https://www.youtube.com/embed/0amDy81M1Ho?si=tx7gBm6gkmCWg0Fv" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<h2>The NFA Algorithm</h2>

Now that we've got an understanding how NFAs work, let's work on an algorithm for classifying words accepted by the NFA, without just using trial and error.
<br>
Let's figure out what to do to determine the answer for the word 'aabba'.

<img src="/img/nfaAlg/empty.png" />

We can do this by simulating all possible paths <span class="highlight highlight-blue">at once</span>.
We'll start by finding all states we can be in before reading any characters at all.
In this example that's just the start state.
<br>
From here we will then want to find all states we can be in, after reading the first character, which is in this case, an 'a'.
We do this by first taking any transitions labelled 'a',

<img src="/img/nfaAlg/highlight-a.png" />

and then taking any possible epsilon transitions connected to the new states.

<img src="/img/nfaAlg/highlight-eps.png" />

Notice that whenever we take an epsilon transition, we should <span class="highlight highlight-orange">leave a copy</span> of the pointer at the start of the transition, because we have the option of not taking it.
So after reading the character 'a', we could be in any state of this NFA.

<img src="/img/nfaAlg/every-state.png" />

What states can be in after reading another 'a'?
First, get rid of all pointers which don't have any 'a' transitions, and move the other pointers along the transitions.

<img src="/img/nfaAlg/second-a.png" />

Again, we find all states reachable via epsilon transitions and add theses as well.

<img src="/img/nfaAlg/second-a-eps.png" />

The next character is 'b', so remove all states without a 'b' transition.

Move the other pointers along 'b' transitions, and then epsilon transitions.

<img src="/img/nfaAlg/move-b.png" />

Do this again for 'b', and then again for 'a'.

<div class="split-page">
<div class="split-img"><img src="/img/nfaAlg/2nd-last.png"/></div>
<div class="split-img"><img src="/img/nfaAlg/last.png"/></div>
</div>

From this, we know the only state we can end up in, after reading all the characters in the word, is D, an accepting state.

This means there is a path from state A to state D, that reads all letters in the word, and so the NFA <span class="highlight highlight-green">accepts</span>.

<img src="/img/nfaAlg/read-word.png" />

Let's look at one more word (abbb) before continuing.
Again, we'll start in state A, and read character 'a'.
After reading the 'a', and moving along the epsilons, we can be in any state.
We then read a 'b', this whittles down our state options to C, D, and E.

<img src="/img/nfaAlg/first-b.png"/>

And then we read a 'b' again, which means we then have to be in state E.
For the final 'b', we have no 'b' transition from state E. So there is no path that allows us to read the entire word.
Therefore the NFA <span class="highlight highlight-red">rejects</span> this word.

<h3>A familiar algorithm</h3>

You might've noticed the first steps for classifying both of these words was the same, namely that reading an 'a', left us in all possible states.
To save ourselves some time, we can figure out what letters take us to what states using a table.
So we can use this table for <span class="highlight highlight-blue">all words</span>, rather than manually computing the paths every time we want to classify a word.

From the start state A, we've already figured out that reading an 'a' leaves us at any possible state in the NFA.
When reading a 'b', we end up in states C, D, or E.

<img src="/img/nfaAlg/table-1.png" />

We then take one of these collections, and then look at what happens when reading an 'a' or reading a 'b' from there.

Reading an 'a' from any state, unsurprisingly leaves us at any state, while reading a 'b' leaves us in the states C, D, or E.

<img src="/img/nfaAlg/table-2.png" />

Can you see what's happening yet?
Starting from C, D, or E, reading an 'a' leaves us at D, while reading a 'b' leaves us at E.
From D we can only read a 'b', and from E we can only read an 'a'.

<img src="/img/nfaAlg/table-all.png" />

And so using this table we can classify any word!

Start at state A, and take each letter in the word and move to the associated collection of states in the table.

<img src="/img/nfaAlg/table-path.png" />

But have you noticed? We've just <span class="highlight highlight-green">made a DFA!</span>
All we need to do is make a node to represent that there are no states available, and we've got a full DFA, where moving through the DFA is the same as simulating all possible paths in the NFA.

We accepted a word in the NFA if it could end on an accepting state, so make all nodes in the DFA accepting, if they include an accepting state in the collection.

<img src="/img/nfaAlg/table-dfa.png" />

Now this DFA accepts exactly the same language as the NFA.

So we've shown anything an NFA can do, we can also achieve with a DFA. Even though we removed a few rules!
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
