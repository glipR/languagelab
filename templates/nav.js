import { isComplete } from '../tools/completion.js';

const navContent = (title) => `
<div class="navHeader">
  <div class="navContainer">
    <div class="projLogo">
      <img src="/icon.png" alt="Language Lab Logo" />
    </div>
    <h1 class="projTitle">Language Lab</h1>
    <div class="pageDropdown">
      <div class="pageDropdownPreview">
        ${title}
      </div>
      <div class="pageDropdownResults">
        <div class="pageDropdownSection smallSection">
          <h4 class="iconWIP pageDropdownSectionTitle">
            Regex
          </h4>
        </div>
        <div class="pageDropdownSection dfaSection">
          <h4 class="pageDropdownSectionTitle">DFA</h4>
          <hr />
          <a class="iconNotes pageDropdownItem ${isComplete(`dfaIntro`) && `complete` }" href="/pages/dfa_intro">
            What is a DFA?
          </a>
          <a class="iconTask pageDropdownItem ${isComplete(`dfaExecute`) && `complete` }" href="/pages/dfa_sim">
            Running the algorithm
          </a>
          <a class="iconTask pageDropdownItem ${isComplete(`dfaCategorise`) && `complete` }" href="/pages/dfa_categorise">
            Analysing DFAs
          </a>
          <a class="iconTask pageDropdownItem ${isComplete(`dfaCreate`) && `complete` }" href="/pages/dfa_create">
            Making DFAs
          </a>
          <a class="iconTask pageDropdownItem ${isComplete(`dfaMatch`) && `complete` }" href="/pages/dfa_match">
            Recognising languages
          </a>
          <a class="iconCode pageDropdownItem ${isComplete(`dfaAlgorithm`) && `complete` }" href="/pages/dfa_code_execute">
            Implementing the algorithm
          </a>
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

const addNav = (title) => {
  document.body.insertAdjacentHTML('afterbegin', navContent(title));

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
}

export default addNav;
