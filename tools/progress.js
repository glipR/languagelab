class Progress {
  constructor(instructions, { progressContainer, instructionText, progress, onSuccess, allowSkipping, storageKey }) {
    this.instructions = instructions;
    this.complete = instructions.map(() => false);
    this.progressContainer = progressContainer;
    this.instructionText = instructionText;
    this.progress = progress;
    this.onSuccess = onSuccess;
    this.allowSkipping = allowSkipping;
    this.storageKey = storageKey;
    this.current = 0;
    if (this.storageKey) {
      this.current = parseInt(localStorage.getItem(this.storageKey) || 0);
      this.complete = this.complete.map((_, i) => i < this.current);
    }
    if (this.progressContainer) {
      this.progressContainer.style.display = "block";
    }
    // This shouldn't change anything
    this.incrementCurrent();
  }

  markCompleted = (index) => {
    if (this.allowSkipping || index === this.current) {
      this.complete[index] = true;
      this.incrementCurrent();
    }
  }

  incrementCurrent = () => {
    while (this.complete[this.current]) {
      this.current++;
    }
    if (this.instructionText) {
      this.instructionText.innerText = this.current < this.instructions.length ? this.instructions[this.current] : "Complete!";
    }
    if (this.progress) {
      this.progress.style.width = `${(this.current / this.instructions.length) * 100}%`;
    }

    if (this.storageKey) {
      localStorage.setItem(this.storageKey, this.current);
    }
    if (this.current >= this.instructions.length) {
      // Reset current to 0.
      this.current = 0;
      if (this.storageKey) {
        localStorage.setItem(this.storageKey, this.current);
      }
      window.setTimeout(() => {
        if (this.progressContainer) {
          this.progressContainer.style.display = "none";
        }
        if (this.instructionText) {
          this.instructionText.innerText = "";
        }
        this.onSuccess?.();
      }, 300);
    }
  }
}

export default Progress;
