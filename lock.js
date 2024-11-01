class LockManager {
  static contentContainers = [];
  static listItems = [];
  // Index of first locked element.
  static curLocked = 1;
  static lockDisplay = null;

  static setItems = (contents, items, lockIndex, lockDisplay) => {
    LockManager.contentContainers = contents;
    LockManager.listItems = items;
    LockManager.curLocked = lockIndex;
    LockManager.lockDisplay = lockDisplay;

    LockManager.listItems.forEach((l, i) => {
      if (i >= LockManager.curLocked) {
        LockManager.lockIndex(i);
      }
    });

    LockManager.lockDisplay.style.opacity = 1;
    LockManager.lockDisplay.style.height = "auto";
  }

  static unlockIndex = (index) => {
    LockManager.contentContainers[index].style.opacity = 1;
    LockManager.contentContainers[index].style.height = "auto";
    LockManager.listItems[index].classList.remove("locked");
    if (index === LockManager.contentContainers.length - 1) {
      LockManager.lockDisplay.style.opacity = 0;
      LockManager.lockDisplay.style.height = "0px";
      LockManager.lockDisplay.style["overflow-y"] = "hidden";
    }
  }

  static lockIndex = (index) => {
    LockManager.contentContainers[index].style.opacity = 0;
    LockManager.contentContainers[index].style.height = "0px";
    LockManager.contentContainers[index].style["overflow-y"] = "hidden";
    LockManager.listItems[index].classList.add("locked");
  }

  // Ensure up to and including index is unlocked.
  static unlockUpTo = (index) => {
    for (let i=LockManager.curLocked; i<=index; i++) {
      LockManager.unlockIndex(i);
    }
    LockManager.curLocked = index + 1;
  }

  static unlockNext = () => {
    LockManager.unlockUpTo(LockManager.curLocked);
  }
}

export default LockManager;
