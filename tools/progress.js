class Progress {
  static STATE_WAITING = 0;
  static STATE_STARTED = 1;
  static STATE_COMPLETED = 2;

  // Instructions can be an array of:
  // - strings
  // - Objects, with the following optional properties:
  //   - text: string
  //   - onStart (GS, instruction) -> cleanup function
  //   - onComplete (GS, instruction) -> cleanup function
  //   - isComplete (GS, instruction) -> boolean
  // Start cleanup is called if a previous instruction is unmarked
  // Complete cleanup is called if the instruction is unmarked
  constructor(instructions, { progressContainer, instructionText, progress, onSuccess, allowSkipping, storageKey, resetOnComplete }, GS) {
    this.GS = GS;
    this.instructions = instructions.map(i => {
      if (typeof i === "string") {
        return { text: i };
      }
      return {...i, state: Progress.STATE_WAITING };
    });
    this.complete = instructions.map(() => false);
    this.progressContainer = progressContainer;
    this.instructionText = instructionText;
    this.progress = progress;
    this.onSuccess = onSuccess;
    this.allowSkipping = allowSkipping;
    this.storageKey = storageKey;
    this.resetOnComplete = resetOnComplete === undefined ? true : resetOnComplete;
    this.current = 0;
    if (this.storageKey) {
      this.current = parseInt(localStorage.getItem(this.storageKey) || 0);
      this.complete = this.complete.map((_, i) => i < this.current);
      for (let i=0; i<this.current; i++) {
        this.completeInstruction(i);
      }
    }
    if (this.progressContainer) {
      this.progressContainer.style.display = "block";
    }
    // This shouldn't change anything
    this.startInstruction(this.current);
    this.incrementCurrent();
  }

  markCompleted = (index) => {
    if (this.allowSkipping || index === this.current) {
      this.complete[index] = true;
      this.incrementCurrent();
    }
  }

  checkCompleted = () => {
    for (let i=0; i<this.instructions.length; i++) {
      if (!this.complete[i] && this.instructions[i].isComplete?.(this.GS, this.instructions[i], this)) {
        if (this.current === i || this.allowSkipping)
          this.completeInstruction(i);
      }
      if (this.complete[i] && this.instructions[i].isComplete?.(this.GS, this.instructions[i], this) === false) {
        this.uncompleteInstruction(i);
      }
    }
  }

  startInstruction = (index) => {
    if (0 > index || index >= this.instructions.length) return;
    this.instructions[index].state = Progress.STATE_STARTED;
    this.instructions[index].onStartCleanup = this.instructions[index].onStart?.(this.GS, this.instructions[index], this);
  }

  completeInstruction = (index) => {
    if (0 > index || index >= this.instructions.length) return;
    this.instructions[index].state = Progress.STATE_COMPLETED;
    if (!this.instructions[index].onComplete) {
      if (this.instructions[index].onStartCleanup) {
        this.instructions[index].onStartCleanup(this.GS, this.instructions[index], this);
      }
    }
    this.instructions[index].onCompleteCleanup = this.instructions[index].onComplete?.(this.GS, this.instructions[index], this);
    this.complete[index] = true;
    this.incrementCurrent();
  }

  uncompleteInstruction = (index) => {
    if (0 > index || index >= this.instructions.length) return;
    this.instructions[index].state = Progress.STATE_WAITING;
    this.instructions[index].onCompleteCleanup?.();
    this.instructions[index].onCompleteCleanup = null;
    this.complete[index] = false;
    this.incrementCurrent();
  }

  getInstructionText = (index) => {
    if (0 > index || index >= this.instructions.length) return;
    const item = this.instructions[index];
    if (typeof item === "string") {
      return item;
    }
    return item.text;
  }

  incrementCurrent = () => {
    let newCurrent = this.instructions.length;
    for (let i=0; i<this.instructions.length; i++) {
      if (!this.complete[i]) {
        newCurrent = i;
        break;
      }
    }
    if (newCurrent < this.current) {
      // Some instructions have been unmarked.
      for (let i=newCurrent+1; i<=this.current; i++) {
        if (this.instructions[i].state === Progress.STATE_STARTED) {
          this.instructions[i].onStartCleanup?.(this.GS, this.instructions[i], this);
          this.instructions[i].onStartCleanup = null;
          this.instructions[i].state = Progress.STATE_WAITING;
        }
      }
    }

    this.current = newCurrent;

    if (this.current < this.instructions.length && this.instructions[this.current].state === Progress.STATE_WAITING) {
      this.startInstruction(this.current);
    }

    if (this.instructionText) {
      this.instructionText.innerHTML = this.current < this.instructions.length ? this.getInstructionText(this.current) : "Complete!";
    }
    if (this.progress) {
      this.progress.style.width = `${(this.current / this.instructions.length) * 100}%`;
    }

    if (this.storageKey) {
      localStorage.setItem(this.storageKey, this.current);
    }
    let reset = false
    if (this.current >= this.instructions.length && this.resetOnComplete) {
      // Reset current to 0.
      this.current = 0;
      if (this.storageKey) {
        localStorage.setItem(this.storageKey, this.current);
      }
      reset = true;
    }
    if (reset || this.current >= this.instructions.length) {
      window.setTimeout(() => {
        if (this.progressContainer) {
          this.progressContainer.style.display = "none";
        }
        if (this.instructionText) {
          this.instructionText.innerHTML = "";
        }
        this.onSuccess?.();
      }, 300);
    }
  }
}

export default Progress;
