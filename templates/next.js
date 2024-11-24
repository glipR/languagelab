const nextButton = (href) => `<a class="button nextButton" href="${href}"><div class="threading"></div>Next</a>`;

const addNextButton = (href) => {
  document.querySelector('.articleBodyCenter').insertAdjacentHTML('beforeend', nextButton(href));
}
export default addNextButton;
