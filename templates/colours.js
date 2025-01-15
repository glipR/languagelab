export const wrapColour = (colour, content) => {
  return `<span class="${colour}">${content}</span>`;
}

export const highlight = (content, color, short, long) => {
  return `<span class="${short ? 'highlight-small' : 'highlight'} highlight-${color}${long ? '-long' : ''}">${content}</span>`;
}
