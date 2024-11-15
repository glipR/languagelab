const addFooter = () => {
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <div class="footer-container">
      <div class="footer-content-section">
        <p>Created by <a href="https://me.glipr.xyz/">Jackson Goerner</a></p>
        <p><a href="https://github.com/glipR/languagelab">Github</a></p>
        <p><a href="#" id="acknowledgementsClick">Acknowledgements</a></p>
        <div id="acknowledgementsModal" class="modal modalFixed">
          <div class="imprint"></div>
          <div class="modalContent">
            <h2>Attribution</h2>
            <ul>
              <li>Ali Toosi for numerous reviews + feedback</li>
              <li><a href="https://handbook.monash.edu/2021/units/FIT2014">FIT2014</a> for initially teaching me the content :)</li>
            </ul>
          </div>
          <div class="modalActions">
            <button id="acknowledgementsButton" class="modalButton">Close</button>
          </div>
        </div>
      </div>
      <div class="footer-content-section">
        <a href="#" id="attributionClick">Attribution</a>
        <div id="attributionModal" class="modal modalFixed">
          <div class="imprint"></div>
          <div class="modalContent">
            <h2>Attribution</h2>
            <ul>
              <li>Video BG by <a href="https://unsplash.com/@joaovtrduarte?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">João Vítor Duarte</a> on <a href="https://unsplash.com/photos/a-black-and-white-photo-of-a-person-on-a-surfboard-k4Lt0CjUnb0?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a></li>
              <li>Header/Footer BG by <a href="https://www.freepik.com/free-photo/blue-paperboard-texture_17197692.htm#fromView=keyword&page=3&position=27&uuid=0b4aaef9-9242-4934-a0d8-761852264d50">FreePik</a></li>
            </ul>
          </div>
          <div class="modalActions">
            <button id="attributionButton" class="modalButton">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(footer);
  document.getElementById('attributionClick').addEventListener('click', () => {
    console.log("test");
    document.getElementById('attributionModal').style.display = 'flex';
  });
  document.getElementById('attributionButton').addEventListener('click', () => {
    document.getElementById('attributionModal').style.display = 'none';
  });
  document.getElementById('acknowledgementsClick').addEventListener('click', () => {
    document.getElementById('acknowledgementsModal').style.display = 'flex';
  });
  document.getElementById('acknowledgementsButton').addEventListener('click', () => {
    document.getElementById('acknowledgementsModal').style.display = 'none';
  });
}

export default addFooter;
