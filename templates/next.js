const nextButton = (href) => `<a class="nextButton" href="${href}">Next</a>`;

const addNextButton = (href) => {
  document.querySelector('.articleBodyCenter').insertAdjacentHTML('beforeend', nextButton(href));
}
export default addNextButton;
