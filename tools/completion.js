export const markComplete = (key) => {
  localStorage.setItem(key, "true");
}

export const isComplete = (key) => {
  return localStorage.getItem(key) === "true";
}

export const markIncomplete = (key) => {
  localStorage.removeItem(key);
}

export const clearAll = () => {
  localStorage.clear();
}
