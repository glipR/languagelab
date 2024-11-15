import { isComplete } from '../tools/completion.js';
import { trueOnce } from '../utils.js';

export const contentMapping = {
  dfaIntro: {
    title: "What is a DFA?",
    type: "notes",
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
}

const iconMap = (type) => {
  switch (type) {
    case "notes":
      return "iconNotes";
    case "game":
      return "iconTask";
    case "code":
      return "iconCode";
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
          ${renderItem('dfaCreate')}
          ${renderItem('dfaMatch')}
          ${renderItem('dfaAlgorithm')}
          ${renderItem('dfaModify')}
        </div>
        <div class="pageDropdownSection smallSection">
          <h4 class="iconWIP pageDropdownSectionTitle"> NFA</h4>
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
  notes: `<h2>Welcome!</h2> <p>Depending on your prefferred learning style, you can either play the video or read the descriptions below. (Or do both, whichever gets the best results!)</p>`,
  game: `<h2>Welcome!</h2> <p>Game sheets are a great way to learn by doing. Read the instructions and hit play when you're ready. You'll have to complete multiple challenges to continue.</p>`,
  code: `<h2>Welcome!</h2> <p>Code sheets are there to strengthen your understanding of the concepts and isn't strongly tested - when you feel you've got everything you want from this sheet (or don't know javascript!) feel free to move onward.</p>`,
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
  if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
    document.querySelector('.navHeader').classList.add('scrolled');
  } else {
    document.querySelector('.navHeader').classList.remove('scrolled');
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
