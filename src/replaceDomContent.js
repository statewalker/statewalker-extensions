export default function replaceDomContent(element, ...nodes) {
    let first;
    for (let node of nodes) {
      if (!first) first = node;
      element.appendChild(node);
    }
    for (let elm = element.firstChild; elm && elm !== first; ) {
      const n = elm;
      elm = elm.nextSibling;
      element.removeChild(n);
    }
  }