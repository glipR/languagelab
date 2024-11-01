const setOptions = (pixiApp, options, callback) => {
  const optionWidth = 300;

  const optionsContainer = new PIXI.Container();
  const optionsBackground = new PIXI.Graphics();
  optionsBackground.rect(0, 0, optionWidth + 40, pixiApp.renderer.height);
  optionsBackground.fill(0x4a5759);

  let optionsOpen = false;
  const optionsButton = new PIXI.Graphics();
  optionsButton.rect(optionWidth + 5, 5, 30, 30);
  optionsButton.fill(0x000000);
  optionsButton.interactive = true;
  optionsButton.buttonMode = true;
  optionsButton.on('pointerdown', () => {
    optionsOpen = !optionsOpen;
  });

  optionsContainer.addChild(optionsBackground);
  optionsContainer.addChild(optionsButton);
  optionsContainer.position.set(-optionWidth, 0);
  pixiApp.stage.addChild(optionsContainer);

  const OPTION_SPACING = 40;
  const KEY_LENGTH = 9.5;
  const KEY_STYLE = {
    fill: 0xffffff,
    align: "left",
    fontFamily: 'monospace',
    fontSize: 20,
  }
  const VALUE_STYLE = {
    fill: 0xffffff,
    align: "left",
    fontFamily: 'monospace',
    fontSize: 16,
  }


  Object.keys(options).forEach((key, index) => {
    const optionKey = new PIXI.Text({ text: key, style: KEY_STYLE });
    optionKey.position.set(10, 10 + OPTION_SPACING * index);
    optionsContainer.addChild(optionKey);

    if (typeof options[key] === 'string') {
      const textBox = new PIXI.Container();
      const textBoxOutline = new PIXI.Graphics();
      textBoxOutline.rect(0, 0, 130, 30).fill(0x222222).stroke(0xffffff, 2);
      const textBoxText = new PIXI.Text({ text: options[key], style: VALUE_STYLE });
      textBoxText.position.set(5, 5);
      textBox.addChild(textBoxOutline);
      textBox.addChild(textBoxText);
      textBox.position.set(optionWidth - textBox.width, 10 + OPTION_SPACING/2 - textBox.height/2 + OPTION_SPACING * index);
      // Add cursor support
      const cursor = new PIXI.Graphics();
      cursor.rect(0, 0, 2, 20).fill(0xffffff);
      cursor.position.set(5, 5);
      cursor.visible = false;
      textBox.addChild(cursor);
      let cursorPosition = 0;
      let typing = false;
      textBox.interactive = true;
      textBox.buttonMode = true;
      textBox.on('pointerdown', (e) => {
        cursorPosition = Math.min(textBoxText.text.length, Math.floor((e.global.x - textBox.position.x) / KEY_LENGTH));
        cursor.position.set(5 + cursorPosition * KEY_LENGTH, 5);
        cursor.visible = true;
        typing = true;
      });

      window.addEventListener('keydown', (e) => {
        if (typing) {
          let tmp = options[key];
          if (e.key === 'Enter' || e.key === 'Escape') {
            cursor.visible = false;
            typing = false;
          } else if (e.key === 'Backspace') {
            tmp = tmp.slice(0, cursorPosition - 1) + tmp.slice(cursorPosition);
            cursorPosition = Math.max(0, cursorPosition - 1);
          } else if (e.key === 'Delete') {
            tmp = tmp.slice(0, cursorPosition) + tmp.slice(cursorPosition + 1);
          } else if (e.key === 'ArrowLeft') {
            cursorPosition = Math.max(0, cursorPosition - 1);
          } else if (e.key === 'ArrowRight') {
            cursorPosition = Math.min(textBoxText.text.length, cursorPosition + 1);
          } else if (e.key.length === 1) {
            tmp = tmp.slice(0, cursorPosition) + e.key + tmp.slice(cursorPosition);
            cursorPosition++;
          }
          options[key] = tmp;
          textBoxText.text = options[key];
          cursor.position.set(5 + cursorPosition * KEY_LENGTH, 5);
          callback?.(options);
        }
      });

      optionsContainer.addChild(textBox);
    } else if (typeof options[key] === 'number') {
      // TODO: Num field with mouse wheel support
      const textBox = new PIXI.Container();
      const textBoxOutline = new PIXI.Graphics();
      textBoxOutline.rect(0, 0, 130, 30).fill(0x222222).stroke(0xffffff, 2);
      const textBoxText = new PIXI.Text({ text: options[key], style: VALUE_STYLE });
      textBoxText.position.set(5, 5);
      textBox.addChild(textBoxOutline);
      textBox.addChild(textBoxText);
      textBox.position.set(optionWidth - textBox.width, 10 + OPTION_SPACING/2 - textBox.height/2 + OPTION_SPACING * index);
      // Add cursor support
      const cursor = new PIXI.Graphics();
      cursor.rect(0, 0, 2, 20).fill(0xffffff);
      cursor.position.set(5, 5);
      cursor.visible = false;
      textBox.addChild(cursor);
      let cursorPosition = 0;
      let typing = false;
      textBox.interactive = true;
      textBox.buttonMode = true;
      textBox.on('pointerdown', (e) => {
        cursorPosition = Math.min(textBoxText.text.length, Math.floor((e.global.x - textBox.position.x) / KEY_LENGTH));
        cursor.position.set(5 + cursorPosition * KEY_LENGTH, 5);
        cursor.visible = true;
        typing = true;
      });

      window.addEventListener('keydown', (e) => {
        if (typing) {
          let tmp = options[key].toString();
          if (e.key === 'Enter' || e.key === 'Escape') {
            cursor.visible = false;
            typing = false;
          } else if (e.key === 'Backspace') {
            tmp = tmp.slice(0, cursorPosition - 1) + tmp.slice(cursorPosition);
            cursorPosition = Math.max(0, cursorPosition - 1);
          } else if (e.key === 'Delete') {
            tmp = tmp.slice(0, cursorPosition) + tmp.slice(cursorPosition + 1);
          } else if (e.key === 'ArrowLeft') {
            cursorPosition = Math.max(0, cursorPosition - 1);
          } else if (e.key === 'ArrowRight') {
            cursorPosition = Math.min(textBoxText.text.length, cursorPosition + 1);
          } else if (e.key.length === 1) {
            tmp = tmp.slice(0, cursorPosition) + e.key + tmp.slice(cursorPosition);
            cursorPosition++;
          }
          options[key] = parseInt(tmp);
          textBoxText.text = options[key];
          cursor.position.set(5 + cursorPosition * KEY_LENGTH, 5);
          callback?.(options);
        }
      });

      optionsContainer.addChild(textBox);

    } else if (typeof options[key] === 'boolean') {
      const checkBox = new PIXI.Container();
      const checkBoxOutline = new PIXI.Graphics();
      checkBoxOutline.rect(0, 0, 25, 25).fill(0x222222).stroke(0xffffff, 2);
      const checkBoxCheck = new PIXI.Graphics();
      checkBoxCheck.rect(5, 5, 15, 15).fill(0x00ff00);
      checkBoxCheck.visible = options[key];
      checkBox.addChild(checkBoxOutline);
      checkBox.addChild(checkBoxCheck);
      checkBox.position.set(optionWidth - 15 - checkBox.width/2, 10 + OPTION_SPACING/2 - checkBox.height/2 + OPTION_SPACING * index);
      optionsContainer.addChild(checkBox);
      checkBox.interactive = true;
      checkBox.buttonMode = true;
      checkBox.on('pointerdown', () => {
        options[key] = !options[key];
        checkBoxCheck.visible = options[key];
        callback?.(options);
      });
    }
  });

  pixiApp.ticker.add(() => {
    if (optionsOpen && optionsContainer.position.x < 0) {
      optionsContainer.position.set(Math.min(optionsContainer.position.x + 40, 0), 0);
    } else if (!optionsOpen && optionsContainer.position.x > -optionWidth) {
      optionsContainer.position.set(Math.max(optionsContainer.position.x - 40, -optionWidth), 0);
    }
  });
}

export default setOptions;
