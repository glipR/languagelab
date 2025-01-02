import { isComplete } from '../tools/completion.js';
import { trueOnce } from '../utils.js';

export const contentMapping = {
  intro: {
    title: "Introduction",
    type: "worded",
    href: "/",
  },
  dfaIntro: {
    title: "What is a DFA?",
    type: "worded",
    href: "/pages/dfa_intro",
  },
  dfaExecute: {
    title: "Running the algorithm",
    type: "game",
    href: "/pages/dfa_sim",
  },
  dfaCategorise: {
    title: "Analysing DFAs",
    type: "game",
    href: "/pages/dfa_categorise",
  },
  dfaTheory: {
    title: "Understanding DFAs",
    type: "questions",
    href: "/pages/dfa_theory",
  },
  dfaCreate: {
    title: "Making DFAs",
    type: "game",
    href: "/pages/dfa_create",
  },
  dfaMatch: {
    title: "Recognising languages",
    type: "game",
    href: "/pages/dfa_match",
  },
  dfaAlgorithm: {
    title: "Implementing the algorithm",
    type: "code",
    href: "/pages/dfa_code_execute",
  },
  dfaModify: {
    title: "Modifying DFAs",
    type: "code",
    href: "/pages/dfa_code_modify",
  },

  regexIntro: {
    title: "Regular Expressions?",
    type: "worded",
    href: "/pages/regex_intro",
  },

  regexClassify: {
    title: "Analysing Regex",
    type: "game",
    href: "/pages/regex_categorise",
  },

  regexMatch: {
    title: "Recognising Languages",
    type: "game",
    href: "/pages/regex_match",
  },

  regexGame: {
    title: "Regex Game",
    type: "game",
    href: "/pages/regex_game",
  },

  nfaIntro: {
    title: "What is an NFA?",
    type: "worded",
    href: "/pages/nfa_intro",
  },
  nfaSimulate: {
    title: "Simulating NFAs",
    type: "game",
    href: "/pages/nfa_sim",
  },
  nfaCategorise: {
    title: "Categorising NFAs",
    type: "game",
    href: "/pages/nfa_categorise",
  },
  nfaMatch: {
    title: "Recognising Languages",
    type: "game",
    href: "/pages/nfa_match",
  },
  nfaAlgorithm: {
    title: "Implementing the algorithm",
    type: "worded",
    href: "/pages/nfa_algorithm",
  },
  nfaConvert: {
    title: "Converting NFAs to DFAs",
    type: "game",
    href: "/pages/nfa_convert",
  },
  nfaTheory: {
    title: "Understanding NFAs",
    type: "questions",
    href: "/pages/nfa_theory",
  },
  regularConversionTheory: {
    title: "It's all connected",
    type: "worded",
    href: "/pages/regular/conversion_theory",
  },
  regularConversionAlgorithm: {
    title: "Executing the algorithm",
    type: "game",
    href: "/pages/regular/conversion_algorithm",
  },
  regularFAForm: {
    title: "The definitive form",
    type: "worded",
    href: "/pages/regular/dfa_form",
  },
  regularFAMinimisation: {
    title: "Minimising DFAs",
    type: "game",
    href: "/pages/regular/fa_minimisation",
  },
  regularTheory: {
    title: "Regular Quiz",
    type: "questions",
    href: "/pages/regular/theory",
  },
  regularPumping: {
    title: "When isn't it regular?",
    type: "worded",
    href: "/pages/regular/pumping",
  },
  regularPumpingGame: {
    title: "Pumping Lemma",
    type: "game",
    href: "/pages/regular/pumping_game",
  },
  regularPumpingTheory: {
    title: "More Pumping Lemma",
    type: "questions",
    href: "/pages/regular/pumping_theory",
  }
}

const iconMap = (type) => {
  switch (type) {
    case "questions":
      return "iconQuestions";
    case "game":
      return "iconTask";
    case "code":
      return "iconCode";
    case "worded":
      return "iconWorded";
    default:
      return "iconWIP";
  }
}

const renderItem = (key) => {
  return `<a class="${iconMap(contentMapping[key].type)} pageDropdownItem ${isComplete(key) && `complete` }" href="${contentMapping[key].href}">
    ${contentMapping[key].title}
  </a>`
}

const pageHidden = (key, section) => {
  return key.startsWith(section) ? "" : "hidden";
}

const sectionsHidden = (key, chapter) => {
  switch (chapter) {
    case "Regular Languages":
      return key.startsWith("dfa") || key.startsWith("regex") || key.startsWith("nfa") || key.startsWith("regular") ? "" : "hidden";
    case "Context Free Languages":
      return key.startsWith("cfg") ? "" : "hidden";
    case "Decidability":
      return key.startsWith("dec") ? "" : "hidden";
    case "Complexity Classes":
      return key.startsWith("cc") ? "" : "hidden";
  }
  return "hidden";
}

const chapterEmpty = (key, chapter) => {
  return sectionsHidden(key, chapter) === "hidden" ? "" : "empty";
}

const navContent = (key) => `
<div class="navHeader">
  <div class="floatingThread"></div>
  <div class="navContainer">
    <div class="projLogo">
      <img src="/icon.png" alt="Language Lab Logo" />
    </div>
    <a class="projTitle" href="/"><h1>Language Lab</h1></a>
    <div class="pageDropdown">
      <div class="pageDropdownPreview ${iconMap(contentMapping[key].type)}">
        ${contentMapping[key].title}
      </div>
      <div class="pageDropdownResults">
        <div class="pageDropdownChapter chapter1 ${chapterEmpty(key, 'Regular Languages')}">
          <div class="chapterTitle">Regular Languages</div>
        </div>
        <div class="pageDropdownChapterContainer ${sectionsHidden(key, 'Regular Languages')}">
          <div class="pageDropdownSection section1">
            <div class="pageDropdownSectionTab section1"></div>
            <div class="sectionTitle">Intro</div>
            <div class="pageDropdownPage ${pageHidden(key, 'intro')}">
              ${renderItem('intro')}
            </div>
          </div>
          <div class="pageDropdownSection section2">
            <div class="pageDropdownSectionTab section2"></div>
            <div class="sectionTitle">DFA</div>
            <div class="pageDropdownPage ${pageHidden(key, 'dfa')}">
              ${renderItem('dfaIntro')}
              ${renderItem('dfaExecute')}
              ${renderItem('dfaCategorise')}
              ${renderItem('dfaTheory')}
              ${renderItem('dfaCreate')}
              ${renderItem('dfaMatch')}
              ${renderItem('dfaAlgorithm')}
              ${renderItem('dfaModify')}
            </div>
          </div>
          <div class="pageDropdownSection section3">
            <div class="pageDropdownSectionTab section3"></div>
            <div class="sectionTitle">Regular Expressions</div>
            <div class="pageDropdownPage ${pageHidden(key, 'regex')}">
              ${renderItem('regexIntro')}
              ${renderItem('regexClassify')}
              ${renderItem('regexMatch')}
              ${renderItem('regexGame')}
            </div>
          </div>
          <div class="pageDropdownSection section4">
            <div class="pageDropdownSectionTab section4"></div>
            <div class="sectionTitle">NFA</div>
            <div class="pageDropdownPage ${pageHidden(key, 'nfa')}">
              ${renderItem('nfaIntro')}
              ${renderItem('nfaSimulate')}
              ${renderItem('nfaCategorise')}
              ${renderItem('nfaMatch')}
              ${renderItem('nfaAlgorithm')}
              ${renderItem('nfaConvert')}
              ${renderItem('nfaTheory')}
            </div>
          </div>
          <div class="pageDropdownSection section5">
            <div class="pageDropdownSectionTab section5"></div>
            <div class="sectionTitle">🚧 Converting and Proving</div>
            <div class="pageDropdownPage ${pageHidden(key, 'regular')}">
              ${renderItem('regularConversionTheory')}
              ${renderItem('regularConversionAlgorithm')}
              ${renderItem('regularFAForm')}
              ${renderItem('regularFAMinimisation')}
              ${renderItem('regularTheory')}
              ${renderItem('regularPumping')}
              ${renderItem('regularPumpingGame')}
              ${renderItem('regularPumpingTheory')}
            </div>
          </div>
        </div>
        <div class="pageDropdownChapter chapter2">
          🚧 Context Free Languages
        </div>
        <div class="pageDropdownChapter chapter3">
          🚧 Decidability
        </div>
        <div class="pageDropdownChapter chapter4">
          🚧 Complexity Classes
        </div>
      </div>

    </div>
  </div>
</div>
`

const firstTimeModalContents = {
  worded: `<h2>Welcome!</h2> <p>Depending on your prefferred learning style, you can either play the video or read the descriptions below. (Or do both, whichever gets the best results!)</p>`,
  game: `<h2>Welcome!</h2> <p>Game sheets are a great way to learn by doing. Read the instructions and hit play when you're ready. You'll have to complete multiple challenges to continue.</p>`,
  code: `<h2>Welcome!</h2> <p>Code sheets are there to strengthen your understanding of the concepts and isn't strongly tested - when you feel you've got everything you want from this sheet (or don't know javascript/python!) feel free to move onward.</p>`,
  questions: `<h2>Welcome!</h2> <p>Question sheets are a great way to test your understanding of the concepts. There's no testing here - once you're happy with you answer/understanding, feel free to move on!</p>`,
}

const makeModal = (content) => {
  const modalHTML = document.createElement('div');
  modalHTML.innerHTML = `
  <div class="modal modalFixed" style="display: flex">
    <div class="imprint"></div>
    <div class="modalContent">
      ${content}
    </div>
    <img src="/img/pin.png" class="iconPin"></img>
    <div class="modalActions">
      <button class="modalButton">Got it!</button>
    </div>
  </div>
  `
  modalHTML.querySelector(".modalButton").addEventListener("click", () => {
    modalHTML.remove();
  });
  return modalHTML;
}

const updateNavHeightWithScroll = () => {
  if (document.body.scrollTop > 30 || document.documentElement.scrollTop > 30) {
    document.querySelector('.navHeader').classList.add('scrolled');
    document.querySelector('.terminal')?.classList?.add?.('scrolled');
  } else {
    document.querySelector('.navHeader').classList.remove('scrolled');
    document.querySelector('.terminal')?.classList?.remove?.('scrolled');
  }
}

const addNav = (key) => {
  document.body.insertAdjacentHTML('afterbegin', navContent(key));
  document.querySelectorAll('.sectionTitle').forEach((el) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      el.parentElement.querySelector('.pageDropdownPage').classList.toggle('hidden');
    });
  });
  document.querySelectorAll('.chapterTitle').forEach((el) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      el.parentElement.classList.toggle('empty');
      el.parentElement.nextElementSibling.classList.toggle('hidden');
    });
  });

  if (trueOnce(contentMapping[key].type)) {
    const modal = makeModal(firstTimeModalContents[contentMapping[key].type]);
    document.body.appendChild(modal);
  }

  // Add click logic to dropdown
  const entireDropdown = document.querySelector(".pageDropdown");
  const dropdown = document.querySelector(".pageDropdownPreview");
  const dropdownResults = document.querySelector(".pageDropdownResults");
  dropdown.addEventListener("click", () => {
    dropdownResults.classList.toggle("active");
  });
  window.addEventListener("click", (e) => {
    if (!entireDropdown.contains(e.target)) {
      dropdownResults.classList.remove("active");
    }
  });
  window.addEventListener("scroll", updateNavHeightWithScroll);
}

export default addNav;
