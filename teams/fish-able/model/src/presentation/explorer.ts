import {loadCollectionSystem} from '../collection-system/orchestration/load-collection-system.js';
import type {
  CollectionSystem,
  Leg,
  Node as CollectionNode,
} from '../collection-system/domain/collection-system.js';

const DEFAULT_NODE_ID = 'dam-strontia';

type Elements = Readonly<{
  loadState: HTMLDivElement;
  loadStatus: HTMLSpanElement;
  retryButton: HTMLButtonElement;
  explorerContent: HTMLDivElement;
  nodeSelect: HTMLSelectElement;
  nodeCount: HTMLElement;
  selectedNodeTitle: HTMLHeadingElement;
  selectedNodeId: HTMLElement;
  selectedNodeKind: HTMLElement;
  legCount: HTMLElement;
  selectionStatus: HTMLElement;
  legsList: HTMLUListElement;
}>;

let collectionSystem: CollectionSystem | undefined;
let selectedNodeId = DEFAULT_NODE_ID;

const elements: Elements = {
  loadState: getElement<HTMLDivElement>('load-state'),
  loadStatus: getElement<HTMLSpanElement>('load-status'),
  retryButton: getElement<HTMLButtonElement>('retry-button'),
  explorerContent: getElement<HTMLDivElement>('explorer-content'),
  nodeSelect: getElement<HTMLSelectElement>('node-select'),
  nodeCount: getElement<HTMLElement>('node-count'),
  selectedNodeTitle: getElement<HTMLHeadingElement>('selected-node-title'),
  selectedNodeId: getElement<HTMLElement>('selected-node-id'),
  selectedNodeKind: getElement<HTMLElement>('selected-node-kind'),
  legCount: getElement<HTMLElement>('leg-count'),
  selectionStatus: getElement<HTMLElement>('selection-status'),
  legsList: getElement<HTMLUListElement>('legs-list'),
};

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing explorer element: ${id}`);
  return element as T;
}

function formatKind(kind: CollectionNode['kind']): string {
  return `${kind.slice(0, 1).toUpperCase()}${kind.slice(1)}`;
}

async function fetchCollectionSource(): Promise<unknown> {
  const response = await fetch('../collection-system.json');
  if (!response.ok) {
    const status = response.statusText ? ` ${response.statusText}` : '';
    throw new Error(`Could not load the Collection System (${response.status}${status}).`);
  }
  return (await response.json()) as unknown;
}

function showLoading(): void {
  elements.loadState.hidden = false;
  elements.loadState.className = 'load-state load-state--loading';
  elements.loadStatus.textContent = 'Loading the Collection System…';
  elements.retryButton.hidden = true;
  elements.retryButton.disabled = true;
  elements.explorerContent.hidden = true;
}

function errorText(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'The Collection System could not be loaded.';
}

function showError(error: unknown): void {
  elements.loadState.hidden = false;
  elements.loadState.className = 'load-state load-state--error';
  elements.loadStatus.textContent = errorText(error);
  elements.retryButton.hidden = false;
  elements.retryButton.disabled = false;
  elements.explorerContent.hidden = true;
}

function populateNodeSelect(nodes: readonly CollectionNode[]): void {
  elements.nodeSelect.replaceChildren();
  for (const node of nodes) {
    const option = document.createElement('option');
    option.value = node.id;
    option.textContent = `${node.name} · ${formatKind(node.kind)}`;
    elements.nodeSelect.append(option);
  }
  elements.nodeCount.textContent = String(nodes.length);

  const initialNode = nodes.find(node => node.id === DEFAULT_NODE_ID) ?? nodes[0];
  if (!initialNode) throw new Error('The Collection System contains no Nodes.');
  selectedNodeId = initialNode.id;
  elements.nodeSelect.value = selectedNodeId;
}

function makeLegCard(
  system: CollectionSystem,
  leg: Leg,
): HTMLLIElement {
  const destination = system.node(leg.to);
  const item = document.createElement('li');
  item.className = 'leg-list__item';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'leg-card';
  button.setAttribute('aria-label', `Explore destination ${destination.name}`);
  button.addEventListener('click', () => {
    selectedNodeId = destination.id;
    elements.nodeSelect.value = destination.id;
    renderSelectedNode(system);
    elements.selectedNodeTitle.focus({preventScroll: true});
  });

  const topLine = document.createElement('span');
  topLine.className = 'leg-card__topline';
  const legLabel = document.createElement('span');
  legLabel.className = 'leg-card__label';
  legLabel.textContent = 'Leg';
  const arrow = document.createElement('span');
  arrow.className = 'leg-card__arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';
  topLine.append(legLabel, arrow);

  const destinationName = document.createElement('span');
  destinationName.className = 'leg-card__destination';
  destinationName.textContent = destination.name;

  const details = document.createElement('span');
  details.className = 'leg-card__details';
  const legId = document.createElement('span');
  legId.textContent = leg.id;
  const destinationKind = document.createElement('span');
  destinationKind.textContent = `Destination Node · ${formatKind(destination.kind)} · ${destination.id}`;
  details.append(legId, destinationKind);

  const action = document.createElement('span');
  action.className = 'leg-card__action';
  action.textContent = 'Explore destination';

  button.append(topLine, destinationName, details, action);
  item.append(button);
  return item;
}

function renderSelectedNode(system: CollectionSystem): void {
  const selectedNode = system.node(selectedNodeId);
  const outgoingLegs = system.legsFrom(selectedNode.id);

  elements.nodeSelect.value = selectedNode.id;
  elements.selectedNodeTitle.textContent = selectedNode.name;
  elements.selectedNodeId.textContent = selectedNode.id;
  elements.selectedNodeKind.textContent = formatKind(selectedNode.kind);
  elements.legCount.textContent = `${outgoingLegs.length} ${outgoingLegs.length === 1 ? 'Leg' : 'Legs'}`;
  elements.selectionStatus.textContent = `${selectedNode.name} selected. ${outgoingLegs.length} outgoing ${outgoingLegs.length === 1 ? 'Leg' : 'Legs'} recorded.`;
  elements.legsList.replaceChildren();

  if (outgoingLegs.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'leg-list__empty';
    empty.textContent = 'No outgoing Legs recorded';
    elements.legsList.append(empty);
    return;
  }

  for (const leg of outgoingLegs) {
    elements.legsList.append(makeLegCard(system, leg));
  }
}

async function load(): Promise<void> {
  showLoading();
  try {
    collectionSystem = await loadCollectionSystem(fetchCollectionSource);
    populateNodeSelect(collectionSystem.nodes());
    renderSelectedNode(collectionSystem);
    elements.explorerContent.hidden = false;
    elements.loadState.hidden = true;
  } catch (error: unknown) {
    collectionSystem = undefined;
    showError(error);
  }
}

elements.nodeSelect.addEventListener('change', () => {
  if (!collectionSystem) return;
  selectedNodeId = elements.nodeSelect.value;
  renderSelectedNode(collectionSystem);
});

elements.retryButton.addEventListener('click', () => {
  void load();
});

void load();
