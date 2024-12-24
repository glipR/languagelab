import { addIcon } from '../templates/icons.js';

// TODO: Correct video

const contentText = `
<div class="aspect-ratio">
<iframe src="https://www.youtube.com/embed/k9LmFzXPcYM?si=3AQBjp0p4NXKk07L" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

NOTE: This is placeholder content and intended to change. The introduction page here is a WIP.

<h2>Why Languages?</h2>

What's in a language, and why on earth do we care about them in computer science?

Surprising as it may be, the study of languages underpins a large amount of <span class="highlight-small highlight-blue-long">computational complexity theory</span>, and even separately from that is practically rather useful as well.

Understanding languages helps us understand:

<ul>
  <li>How Computers can understand interpreted code and turn this into instructions</li>
  <li>How to write expressions to search for patterns in text</li>
  <li>What problems computers will never be able to solve!</li>
</ul>

<h2>What is a language?</h2>

While there are some similarities between the languages we speak and the languages we use in computer science, it's important we clarify what we mean when we talk about a language in this context.
<br>
A language is defined over an <span class="highlight highlight-orange">alphabet</span>, which is a set of symbols. Alphabets mean very much the same thing in both contexts - words in the language are composed of symbols in the alphabet.

Considering all possible combinations of symbols in the alphabet, we can form words. These symbols could be letters like a and b, but they could also be numbers, emojis, or even <span class="highlight-small highlight-purple-long">entire strings themselves</span>.
<br>
A language is simply a <span class="highlight highlight-orange">collection</span> of these words. There is no rule on the conjugation of these words, no such thing as 'sentences' or 'grammar' in the context of languages in computer science.

<img src="/img/intro/languageTypes.png"/>

This simple definition leads to more complexity and results than you might think at first glance.

Let's look at three examples of languages, and look at words that are/aren't in them.

<h3>Words with an even amount of 'a's (Alphabet: $\\{a, b\\}$)</h3>

<img src="/img/intro/evenLang.png"/>

This language considers all words made up of 'a's and 'b's, and says they are in the language if they have an even number of 'a's in total.

Relatively simple to understand, right? It's also super easy to check - just count the number of 'a's in the word!

<h3>Python code with no syntax errors (Alphabet: Anything on your keyboard)</h3>

<img src="/img/intro/validPythonLang.png"/>

This language's alphabet is more complex, allowing spaces, brackets, numbers, and other special characters (even newlines).

This language is quite hard to describe in full, and also relatively hard to check - but our computers seem to be able to do it very well!

We'll learn how this is done, and how to define the syntax for a language like Python in future lessons.

<h3>Python code that will eventually print the number 42.</h3>

<img src="/img/intro/42Lang.png"/>

This language is even more complex - it's not just about the syntax of the code, but also about the runtime.

So in order to answer the question, we need to know to some extent what the code does.

This is a much harder problem to solve, in fact, as we'll prove near the end of this course, it's impossible for us to define a computer program to answer this question universally!

<h2>So what's in this course?</h2>

This course is about exploring the theory of more and more complex languages, algorithms for identifying words in those languages, and the limitations of those algorithms.

We'll start with relatively simple algorithms/languages, and use this to build towards the tough questions you've seen above.

But more importantly than anything else, <span class="highlight-small highlight-green-long">we'll have fun doing it!</span> This course is interactive wherever possible, so you'll have the opportunity to execute, design, and explore the algorithms and languages provided.
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
}

export default addContent;
