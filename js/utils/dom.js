// Construcción de nodos sin innerHTML: el texto siempre se asigna como textContent.
export function crearNodo(tag, props = {}, ...hijos) {
  const nodo = document.createElement(tag);
  for (const [clave, valor] of Object.entries(props)) {
    if (clave === 'texto') nodo.textContent = String(valor ?? '');
    else if (clave === 'class') nodo.className = String(valor);
    else if (clave === 'style' || clave.includes('-')) nodo.setAttribute(clave, String(valor));
    else nodo[clave] = valor;
  }
  for (const hijo of hijos) {
    if (hijo == null) continue;
    nodo.append(typeof hijo === 'string' ? document.createTextNode(hijo) : hijo);
  }
  return nodo;
}