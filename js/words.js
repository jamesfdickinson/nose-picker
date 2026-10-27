// Gesture string <-> words, carried over from the 2020 NosePickerCore port.
export function gestureToWords(pattern) {
  return pattern
    .replace(/ULDR/g, 'counterclockwise circle ')
    .replace(/URDL/g, 'clockwise circle ')
    .replace(/U/g, 'up ')
    .replace(/D/g, 'down ')
    .replace(/L/g, 'left ')
    .replace(/R/g, 'right ')
    .replace(/X/g, 'shake sideways ')
    .replace(/Y/g, 'shake up-down ')
    .trim();
}

export function wordsToGesture(words) {
  return words
    .replace(/1/gi, 'U').replace(/2/gi, 'R').replace(/3/gi, 'D').replace(/4/gi, 'L').replace(/5/gi, 'Y')
    .replace(/one/gi, 'U').replace(/two/gi, 'R').replace(/three/gi, 'D').replace(/four/gi, 'L').replace(/five/gi, 'Y')
    .replace(/up/gi, 'U').replace(/down/gi, 'D').replace(/left/gi, 'L').replace(/right/gi, 'R').replace(/shake/gi, 'Y')
    .replace(/counterclockwise circle/gi, 'ULDR').replace(/clockwise circle/gi, 'URDL')
    .replace(/clockwise/gi, 'URDL').replace(/counterclockwise/gi, 'ULDR').replace(/circle/gi, 'URDL')
    .replace(/\s/g, '');
}
