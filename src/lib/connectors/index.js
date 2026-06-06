import nextInsight from './next-insight';

const REGISTRY = {
  next_insight: nextInsight,
};

export function getConnector(type) {
  return REGISTRY[type] || null;
}

export function listConnectors() {
  return Object.values(REGISTRY);
}

export function getConnectorTypeLabels() {
  return Object.entries(REGISTRY).map(([type, mod]) => ({
    value: type,
    label: mod.label,
    logoInitials: mod.logoInitials,
  }));
}
