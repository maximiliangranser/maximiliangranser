const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function element(name, attributes, children) {
  const tag = `${name}${attributeList(attributes)}`;
  if (!children) return `<${tag}/>`;
  return `<${tag}>${children.join('')}</${name}>`;
}

export function onlyWhen(condition, ...parts) {
  return condition ? parts : [];
}

export function escapeXml(text) {
  return String(text).replace(/[&<>"]/g, (character) => XML_ESCAPES[character]);
}

function attributeList(attributes) {
  return Object.entries(attributes).map(([name, value]) => ` ${name}="${value}"`).join('');
}
