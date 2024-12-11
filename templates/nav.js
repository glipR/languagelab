import { isComplete } from '../tools/completion.js';
import { trueOnce } from '../utils.js';

export const contentMapping = {
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

const navContent = (key) => `
<div class="navHeader">
  <div class="floatingThread"></div>
  <div class="navContainer">
    <div class="projLogo">
      <img src="/icon.png" alt="Language Lab Logo" />
    </div>
    <h1 class="projTitle">Language Lab</h1>
    <div class="pageDropdown">
      <div class="pageDropdownPreview">
        ${contentMapping[key].title}
      </div>
      <div class="pageDropdownResults">
        <div class="pageDropdownSection smallSection">
          <h4 class="iconWIP pageDropdownSectionTitle">
            Regex
          </h4>
        </div>
        <div class="pageDropdownSection dfaSection">
          <h4 class="iconSection pageDropdownSectionTitle"> DFA</h4>
          <hr />
          ${renderItem('dfaIntro')}
          ${renderItem('dfaExecute')}
          ${renderItem('dfaCategorise')}
          ${renderItem('dfaTheory')}
          ${renderItem('dfaCreate')}
          ${renderItem('dfaMatch')}
          ${renderItem('dfaAlgorithm')}
          ${renderItem('dfaModify')}
        </div>
        <div class="pageDropdownSection nfaSection">
          <h4 class="iconSection pageDropdownSectionTitle"> NFA</h4>
          <hr />
          ${renderItem('nfaIntro')}
          ${renderItem('nfaSimulate')}
          ${renderItem('nfaCategorise')}
          ${renderItem('nfaMatch')}
          ${renderItem('nfaAlgorithm')}
          ${renderItem('nfaConvert')}
          ${renderItem('nfaTheory')}
        </div>
        <div class="pageDropdownSection smallSection">
          <h4 class="iconWIP pageDropdownSectionTitle"> Translating</h4>
        </div>
        <div class="pageDropdownSection smallSection">
          <h4 class="iconWIP pageDropdownSectionTitle"> Proving Stuff!</h4>
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

  if (trueOnce(contentMapping[key].type)) {
    const modal = makeModal(firstTimeModalContents[contentMapping[key].type]);
    document.body.appendChild(modal);
  }

  // Add click logic to dropdown
  const dropdown = document.querySelector(".pageDropdownPreview");
  const dropdownResults = document.querySelector(".pageDropdownResults");
  dropdown.addEventListener("click", () => {
    dropdownResults.classList.toggle("active");
  });
  window.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdownResults.classList.remove("active");
    }
  });
  window.addEventListener("scroll", updateNavHeightWithScroll);
}

export default addNav;
