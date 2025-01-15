import { addIcon } from '../templates/icons.js';
import { wrapColour, highlight } from '../templates/colours.js';
import { red } from '../colours.js';

const contentText = `
<div class="aspect-ratio">
<iframe src="https://www.youtube.com/embed/cpOvE-LuHPo?si=OgTRDj3oHcFmUdkO" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<h2>What do we know about Regular Languages?</h2>

Now that we've seen multiple distinct ways to define a language,
let's think about what connects all three machines to inform some properties we can prove about regular languages.
<br>
The three machines we've seen so far are very different in their expression, but they all share one key feature - loops.
<br>
In order to match words of arbitrary length, we need to be able to loop back to shared states, implying that in some sense we can "reduce" what we need to know about the string to a very small bit of information.

In the next few pages, we'll be exploring two main properties of the machines we've seen, and how we can use this to generate facts about regular languages, namely:

<ul>
  <li>Regular Languages have a finite number of states (this page)</li>
  <li>Regular Languages require looping to recognise words of a certain length (next page)</li>
</ul>

<h3>Finite number of states</h3>

The first property we're looking at is that for regular languages, they can be represented by a DFA, and therefore a machine with a finite number of states.

This is interesting, because it means while reading a word, we can often forget a lot of the information we've read so far, since our execution only depends on what lies ahead, and what state we're in.

<img src="/img/regularMinimise/determined.png" />

For example, take the language of words that contain 'abb' as a substring. A DFA for this language is as follows:

<img src="/img/regularMinimise/reading-1.png" />

After reading bbbbba, we're in state ${addIcon('a')}, and the same is true after reading aaaaa.
<br>
As such, if we have any word $w =$ 'bbbbba' $+\\ x$, where $x$ is a word, then this word will always land in the same state as $v =$ 'aaaaa' $+\\ x$, and so $w$ is accepted if and only if $v$ is accepted.
In other words, we can swap the prefix 'bbbbba' with 'aaaaa' and not change the outcome for the word.

<div class="split-page">
  <div class="split-img"><img src="/img/regularMinimise/reading-2.png" /></div>
  <div class="split-img"><img src="/img/regularMinimise/reading-3.png" /></div>
</div>

This is an interesting relationship, so let's give it a name:

<div class="definitionBlock">
  <h3>Prefix-equivalence</h3>
  Two words $w$ and $v$ are ${highlight('prefix-equivalent', 'blue', true, true)}
  if for any word $x$, $w + x$ is accepted if and only if $v + x$ is accepted.
</div>


<br>
We've just shown that for any two words landing in the same state, they must be prefix-equivalent. Is that the only time this relationship holds?

<h3>Prefix-equivalence</h3>

Let's draw prefix-equivalence as a blue line between two words $w$ and $v$.
<br>
Here's some, but not all, relationships for the language of words containing 'abb' as a substring:

<img src="/img/regularMinimise/relationships-1.png" />

This relationship itself satifies three key criteria:

<h4>Reflexivity</h4>
Any word is prefix-equivalent to itself, as $w + x$ is always accepted if $w + x$ is accepted.
<br>
Since this is true for all words, I'm going to leave out the blue loops from the diagram:

<img src="/img/regularMinimise/relationships-2.png" />

<h4>Symmetry</h4>

<img style="max-height: 200px" src="/img/regularMinimise/rule-2.png" />

If $w$ is prefix-equivalent to $v$, then $v$ is prefix-equivalent to $w$.
This is because the statement itself is an equivalence (if and only if), so you get the other direction for free.
<br>
So every blue line in the diagram is bidirectional:

<img src="/img/regularMinimise/relationships-3.png" />

<h4>Transitivity</h4>

<img style="max-height: 200px" src="/img/regularMinimise/rule-3.png" />

If $w$ is prefix-equivalent to $v$, and $v$ is prefix-equivalent to $u$, then $w$ is prefix-equivalent to $u$.
<br>
This is true because if $w + x$ is accepted, then by $w/v$ prefix-equivalence, $v + x$ is accepted, and then by $v/u$ prefix-equivalence $u + x$ is accepted.
<br>
So $w + x$ being accepted implies $u + x$ being accepted, and the same is true for rejection as well.

So as soon as we have any word $w$ connected to another word $v$, then $w$ connects to all of $v$'s neighours, and neighbours neighours, and so on.

<div class="split-page">
  <div class="split-img"><img src="/img/regularMinimise/relationships-3-again.png" /></div>
  <div class="split-img"><img src="/img/regularMinimise/relationships-3-again-again.png" /></div>
</div>

The end result of these three properties is what I'm going to call "Globs" (but you could also call equivalence classes, if you wanted to be a nerd).

<img src="/img/regularMinimise/relationships-globs.png" />

Every word in the glob is prefix-equivalent to every other word in the glob, and no word outside the glob is prefix-equivalent to any word in the glob.
<br>
This is because as soon as one word is connected to a glob, by transitivity it's connected to all of the glob's words.

<h3>Globs and Regular Languages</h3>

But how does this relate to DFAs?

Well, as we've seen earlier, all words that end in a certain state are prefix-equivalent, and so are in the same glob.

So in other words each state is a 'subset' of a glob. That means regular languages have a finite number of globs!
In fact, we could ${highlight('define', 'purple')} regular languages as languages with a finite number of globs!

${highlight('Is globs to states one-to-one?', 'orange', true, true)} Not always, while states are subsets of globs, globs don't necessarily have to be subsets of states.
<br>
Take the following DFA for the language of words where the word is empty, or the second character in the word is 'a'. Next to the DFA we've annotated the collections of words ending at particular states: (the blue/purple globs only have a few example words, of course):

<img src="/img/regularMinimise/dfa-2nd-unmerged.png" />

Where we've got 5 groups:

<ul>
  <li>The empty word</li>
  <li>The letter a</li>
  <li>The letter b</li>
  <li>Words with second character 'a'</li>
  <li>Words with second character 'b'</li>
</ul>

Notice that a and b are prefix-equivalent even though they end in different states,
since after the first character is read, the only thing that determines acceptance is whether the next character is an a.

So the language actually has four globs, which we can use to make an even simpler DFA:

<img src="/img/regularMinimise/dfa-2nd-merged.png" />

So the number of states in a DFA is always greater than or equal to the number of globs in the language, but can we always simplify our DFA to reduce the number of states to the number of globs?
<br>
The answer is surprisingly yes. We'll solve this two different ways.

<h3>Method 1: Directly from the Globs</h3>
Suppose we've found the globs for our language, which necessarily must be a finite collection.

Let's prove a few things about the words in these globs:

<div class="definitionBlock">
<ul>
  <li>If $w$ and $v$ are in the same glob, they are either both accepted or both rejected.</li>
  <li>If $w$ and $v$ are in the same glob, then $w+x$ and $v+x$ are in the same glob.</li>
</ul>
</div>

The first property is easy enough to prove, we can just sub in $x=\\epsilon$ into the prefix-equivalence, to show that $w+x=w$ is accepting if and only if $v+x=v$ is accepting.
<br>
The second property is a teensy bit harder. Consider the definition of $w$ and $v$ being prefix equivalent vs. $w+x$ and $v+x$ being prefix equivalent.

<div class="definitionBlock">
  <h3>$w$ and $v$ are prefix-equivalent</h3>
  For any word $x$, $w$ + ${wrapColour('green', '$x$')} is accepted if and only if $v$ + ${wrapColour('green', '$x$')} is accepted.
</div>

<div class="definitionBlock">
  <h3>$w$ + ${wrapColour('orange', '$x$')} and $v$ + ${wrapColour('orange', '$x$')} are prefix-equivalent</h3>
  For any word ${wrapColour('orange', '$y$')}, $w$ + ${wrapColour('orange', '$x$')} + ${wrapColour('orange', '$y$')} is accepted if and only if $v$ + ${wrapColour('orange', '$x$')} + ${wrapColour('orange', '$y$')} is accepted.
</div>

We know the first property is true, and we want to prove the second.

Since $x$ can be any word in the definition of prefix-equivalent, we can substitute the orange $x+y$ in the second box as the green $x$ in the first box, which tells us that $w+x+y$ is accepted if and only if $v+x+y$ is accepted, which is exactly what we wanted to prove!

<br>
By having x be a single character in the second rule, we can see that adding some character to any word in a glob will deterministically move you to another glob.
<br>
For example in this group, representing the language of 'abb' again, consider the glob containing epsilon and b.
<br>
Taking any word in this glob and adding an 'a' to it will always lead us to a word in the red glob, and adding a 'b' will always take us to a word in our own glob.

<img src="/img/regularMinimise/method1-arrows-again.png" />

This sounds a lot like transitions, right?

We can turn every glob into a state, and figure out glob transitions by simply reading out transitions for a particular word in that glob.

<img src="/img/regularMinimise/method1-transitions.png" />

The glob containing epsilon is the start state, and from the first rule we know that every glob is made up of words that are either all accepting, or all rejecting, and so we can use this to determine our accepting states.

<img src="/img/regularMinimise/method1-complete.png" />

So there is a ${highlight('unique', 'blue', true)} DFA with the smallest number of states, and in a sense it identifies the globs of the language. How neat is that?

<h3>Method 2: Reducing an existing DFA</h3>
That method is cool and all, but it requires something we don't always have - the globs.

What we often do have is a DFA, and we've shown that our DFA is essentially the same except some globs have been separated into multiple states.
Can we figure out how to put them back together?
<br>
<br>
Rather than trying to join them back bit-by-bit, let's just try to merge everything and then only split the states that we need to.

We'll start with all of our states in a single glob. We're going to represent globs as colours in the left table:

<img src="/img/regularMinimise/glob-1-1.png" />

Now our aim here is for the globs represented by the table to follow the two rules that we found earlier.
<br>
The first thing we'll need to do is split the accepting states from the rejecting ones, to follow rule number one.
<br>
This is because any word that is accepted can't be prefix equivalent to one that's rejected.

<img src="/img/regularMinimise/glob-2-1.png" />

At this point, we might be done! But what if we're not? Well that means that we're breaking the second rule that we saw, and what does this look like for our globs?
<br>
We've got two states in the DFA which are currently in the same glob, and they have transitions that don't point to the same glob.
<br>
In the table, that means we've got two states which are the same colour, but their transitions don't have the same colours.

<img src="/img/regularMinimise/glob-b-c-diff.png" />

In our example, B and C are two states that we want to look at.
<br>
For the 'a' transition, they both point to red states, which is good, but for the 'b' transition, B goes to A, which is a red state, whereas C goes to F, which is a purple state.
<br>
So B and C cannot be prefix-equivalent and therefore cannot be in the same glob.
<br>
So what we're going to do is select all states that have a 'b' transition to the purple state (so that's C and D), and move them into a separate glob.

<img src="/img/regularMinimise/glob-b-c-after-split.png" />

And we can see that after doing that we've moved all of the transitions to be a bit more consistent.

After doing that though we've still got some violations of that second rule.
<br>
The green glob looks fine, we've got 'a' to red, and 'b' to purple, but the red glob still has some issues.
<br>
A and E, on reading a 'b' both go to the green glob, but B, on reading a 'b', goes to the red glob.
<br>
So we'll separate B from A and E!

<img src="/img/regularMinimise/glob-4-state.png" />

And that's looking a lot more consistent now! The red yellow and green globs all follow the first and second rules.

But in splitting that up, now we've broken the second rule for the purple glob!
If we look at the purple glob, on reading the character 'a', F will go to A, which is in the red glob, and G will go to B, which is in the yellow glob.
<br>
So now we'll separate out F and G,

<img src="/img/regularMinimise/glob-4-3.png" />

and finally we've found a collection of globs which satisfies rule one and rule two.
<br>
So from here we can make our DFA just like in the previous method, where we read off transitions by looking at a singular state, and seeing where that goes within the glob.

<img src="/img/regularMinimise/glob-dfa.png" />

So that's our DFA minimisation algorithm!

<div class="definitionBlock">
<h3>DFA Minimisation Algorithm</h3>
<ol>
  <li>Start with a DFA, in tabular form.</li>
  <li>Colour the ${wrapColour('green', 'accepting')} and ${wrapColour('red', 'non-accepting')} states two different colours.</li>
  <li>Repeat until no pairing exists:
    <ol>
      <li>Find a pairing of states ${wrapColour('purple', '$x$')} and ${wrapColour('purple', '$y$')} and a character $c$ such that ${wrapColour('purple', '$x$')} is the same colour as ${wrapColour('purple', '$y$')}, but the $c$ transition for ${wrapColour('purple', '$x$')} leads to a different colour than the $c$ transition for ${wrapColour('purple', '$y$')}.</li>
      <li>Choose a ${wrapColour('orange', 'new colour')}</li>
      <li>Colour ${wrapColour('orange', '$y$')}, as well as all other states which are currently the same colour as ${wrapColour('purple', '$x$')} and whose $c$ transition is the same colour as ${wrapColour('orange', '$y$')}'s.</li>
    </ol>
  </li>
  <li>Each colour is a state in the new DFA.</li>
  <li>To read off the transitions for a state, copy the transitions from any state in the original DFA with that colour, replacing the individual end states with the colour they have.
</ol>
</div>

<h3>But wait!</h3>

Hang on a second, let's have a look at our generated DFA, because that doesn't look optimal to me! Can you tell what's wrong with it?

<img src="/img/regularMinimise/glob-dfa.png" />

The issue is that while B and G are states that we can't clob together with the others due to their transitions, sure, but that's besides the point, because they're unreachable! Both in the original DFA, and in our minimised form, so we can remove them!

<img src="/img/regularMinimise/glob-dfa-again.png" />

So let's have another go at our definition:

<div class="definitionBlock" style="position: relative">
<div id="extra" style="color: ${red.toHex()}; position: absolute; right: 20px; top: 10px; background: url(/img/backgrounds/soft-paper.jpg); padding: 10px; transform: translateX(120px) rotate(30deg);">But remove unreachable states!</div>
<h3>DFA Minimisation Algorithm</h3>
<ol>
  <li>Start with a DFA, in tabular form.</li>
  <li>Colour the ${wrapColour('green', 'accepting')} and ${wrapColour('red', 'non-accepting')} states two different colours.</li>
  <li>Repeat until no pairing exists:
    <ol>
      <li>Find a pairing of states ${wrapColour('purple', '$x$')} and ${wrapColour('purple', '$y$')} and a character $c$ such that ${wrapColour('purple', '$x$')} is the same colour as ${wrapColour('purple', '$y$')}, but the $c$ transition for ${wrapColour('purple', '$x$')} leads to a different colour than the $c$ transition for ${wrapColour('purple', '$y$')}.</li>
      <li>Choose a ${wrapColour('orange', 'new colour')}</li>
      <li>Colour ${wrapColour('orange', '$y$')}, as well as all other states which are currently the same colour as ${wrapColour('purple', '$x$')} and whose $c$ transition is the same colour as ${wrapColour('orange', '$y$')}'s.</li>
    </ol>
  </li>
  <li>Each colour is a state in the new DFA.</li>
  <li>To read off the transitions for a state, copy the transitions from any state in the original DFA with that colour, replacing the individual end states with the colour they have.
</ol>
</div>

<h3>What have we learned?</h3>

We've learned both some very abstract viewpoints on regular languages, as well as some very practical tools to work with them:

<ul>
  <li>Regular languages have a finite number of 'globs' of 'prefix-equivalent' words.</li>
  <li>The number of states in a DFA is always greater than or equal to the number of globs in the language, and the collection of words that end in a particular state are a subset of one particular glob.</li>
  <li>The globs can form the states of a DFA.</li>
  <li>We can minimise the states of an existing DFA using the algorithm mentioned above.</li>
</ul>
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
}

export default addContent;
