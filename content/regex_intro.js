const contentText = `
<div class="aspect-ratio">
<iframe src="https://www.youtube.com/embed/7aDmHqVjcOs?si=g7ZWixmR6mF0uKVN" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<h2>Regular Expressions</h2>

The next way we define languages is something you might've already seen if you've done some programming, or used a terminal before - <span class="highlight-small highlight-blue-long">regular expressions</span>, often shortened to Regex!

<h3>What are regular expressions?</h3>

Regular expressions are essentially just an extension of basic strings that allows a few operations.

For example, 'aab' is a valid Regular Expression, and it defines the language that contains the word 'aab' and nothing else.

But, if we add a star to the word like so: 'aa*b', this defines the language that contains at least one a (but possibly more) followed by a single b. So the language includes 'ab', 'aab', 'aaaaab', and so on.

Let's cover all of the operators before we go further:

<h4>Kleene Star ( * )</h4>

The Kleene Star is the first operator. It means <span class="highlight highlight-blue">'zero or more'</span> of the previous character. So in our previous example, 'aa*b', since we've got 'a', then 'a*', then 'b', we expect one 'a', <span class="highlight-small highlight-blue-long">followed by zero or more a's</span>, and then a b.

<img src="/img/regexIntro/star.png"/>

<h4>Pipe ( | )</h4>

The pipe operator fits between two characters, and it means <span class="highlight-small highlight-orange">'or'</span>. It only acts on single elements, so 'a|b' means 'a or b', whereas 'aa|bb' means "an 'a', followed by an 'a' or 'b', followed by a 'b'".

<img src="/img/regexIntro/pipe.png"/>

<h4>Brackets ( () )</h4>

Brackets are used to group expressions together, so that the two previous operators can act on <span class="highlight highlight-purple">larger elements</span>. For example, '((ab)|(ba))*' means "0 or more repetitions of blocks, and these blocks can either be 'ab' or 'ba'".

<img src="/img/regexIntro/bracket.png"/>

<h3>An example</h3>

Let's look at a more complicated regular expression to understand this deeper:

<br>
<span class="highlight highlight-green-long">(c(abbb*a)|(baaa*b))*c</span>
<br>

Let's understand each component of the regular expression, and build up to the full expression.

<ul>
  <li><span class="highlight highlight-blue">'abbb*a'</span> Matches words that start with an 'a', then have at least 2 'b's, then finish with an 'a'. Kind of like a fence - some 'a's surrounding at least 2 'b's!</li>
  <li><span class="highlight highlight-orange">'baaa*b'</span> This is the same as above except for a character swap - some 'b's surrounding at least 2 'a's</li>
  <li><span class="highlight-small highlight-purple-long">'c(abbb*a)|(baaa*b)'</span> Uses the pipe operator to select just one of the two fences, and prepends it with a c. (Example: cbaaaaab)</li>
  <li><span class="highlight-small highlight-yellow-long">'(c(abbb*a)|(baaa*b))*'</span> Allows zero or multiple instances of this 'c'+fence pattern. (Example: cbaaaaabcabba)</li>
  <li><span class="highlight-small highlight-green-long">'(c(abbb*a)|(baaa*b))*c'</span> Matches the exact same thing, but adds a 'c' on the end. (Example: cbaaaaabcabbac)</li>
</ul>

So the end result is multiple of these 'fences', that are themselves fenced in by 'c's:

<ul>
  <li><span class="highlight-purple-long">c<span class="highlight-blue-long">abb<span class="highlight-red-long">b</span>a</span>c<span class="highlight-orange-long">baab</span>c</span></span></li>
  <li><span class="highlight-purple-long">c<span class="highlight-blue-long">abb<span class="highlight-red-long">b</span>a</span>c<span class="highlight-blue-long">abb<span class="highlight-red-long">bbb</span>a</span>c<span class="highlight-orange-long">baab</span>c</span></li>
</ul>

Notice that when using the kleene star to accept multiple copies of the fence, we don't have to use the same subword each time - as long as each subword matches the pattern, it works.

In other words, we can make different 'choices' for each fence.

The derivation of the word 'cbaaaaabcabbac' might look something like this:

<img src="/img/regexIntro/derivation.png"/>

<h3>How does this compare to DFAs?</h3>

It'll take some more understanding and better tooling before we can completely compare the two, but some things are easier with Regular Expressions, while others are undeniably much harder.

For example, take the language of words in alphabetical order we saw earlier. This is relatively easy in Regular Expressions, since we can write this as:

<img src="/img/regexIntro/compare1.png"/>

But others, even relatively simple languages, become rather unruly in Regular Expressions. For example, the language of words with an even amount of 'a's, is definable, but not in a very natural way:

<img src="/img/regexIntro/compare2.png"/>

Over the next few lessons, we'll get comfortable with Regular Expressions, both analysing them and writing them ourselves!
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
}

export default addContent;
