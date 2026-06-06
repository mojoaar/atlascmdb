import { upsertService, upsertApplication, upsertRelationship } from './base';

const connector = {
  type: 'next_insight',
  label: 'Next Insight',
  logoInitials: 'NI',

  syncableEntities: ['application', 'service', 'relationship'],

  configurableFields: {
    application: [
      'name', 'description', 'ownerTeamId', 'lifecycleStatus',
      'environment', 'classification', 'vendor', 'version',
      'appType', 'technologyStack',
    ],
    service: [
      'name', 'description', 'ownerTeamId', 'lifecycleStatus',
      'environment', 'classification', 'businessCriticality',
      'businessOwner', 'serviceTier', 'supportModel', 'serviceCategory',
    ],
  },

  async testConnection(config) {
    const { baseUrl, apiKey } = config;
    if (!baseUrl) return { ok: false, message: 'Base URL is required' };
    if (!apiKey) return { ok: false, message: 'API Key is required' };

    try {
      const url = baseUrl.replace(/\/+$/, '');
      // TODO: verify endpoint path with Next Insight API docs
      const response = await fetch(`${url}/api/v1/health`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      });

      if (response.ok) {
        return { ok: true, message: 'Connection successful' };
      }

      if (response.status === 401 || response.status === 403) {
        return { ok: false, message: 'Authentication failed — check your API key' };
      }

      return { ok: false, message: `Unexpected response: HTTP ${response.status}` };
    } catch (err) {
      return { ok: false, message: `Connection failed: ${err.message}` };
    }
  },

  async sync(connector, db) {
    const { baseUrl, apiKey } = connector;
    const url = baseUrl.replace(/\/+$/, '');
    const headers = { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' };
    const stats = { created: 0, updated: 0, skipped: 0, errored: 0, errors: [] };

    // ---- 1. Fetch applications ----
    // TODO: confirm endpoint path with Next Insight API docs
    try {
      const appRes = await fetch(`${url}/api/v1/applications`, { headers });
      if (appRes.ok) {
        const appData = await appRes.json();
        const applications = Array.isArray(appData) ? appData : (appData.data || appData.items || []);
        for (const item of applications) {
          try {
            const mapped = mapper.mapApplication(item);
            if (!mapped) continue;
            const result = await upsertApplication(db, mapped, connector);
            stats[result.action]++;
          } catch (e) {
            stats.errored++;
            stats.errors.push({ entity: 'application', externalRef: item.id || item.externalRef, error: e.message });
          }
        }
      } else {
        stats.errors.push({ entity: 'applications', error: `HTTP ${appRes.status}: failed to fetch applications` });
      }
    } catch (e) {
      stats.errors.push({ entity: 'applications', error: e.message });
    }

    // ---- 2. Fetch services ----
    // TODO: confirm endpoint path with Next Insight API docs
    try {
      const svcRes = await fetch(`${url}/api/v1/services`, { headers });
      if (svcRes.ok) {
        const svcData = await svcRes.json();
        const services = Array.isArray(svcData) ? svcData : (svcData.data || svcData.items || []);
        for (const item of services) {
          try {
            const mapped = mapper.mapService(item);
            if (!mapped) continue;
            const result = await upsertService(db, mapped, connector);
            stats[result.action]++;
          } catch (e) {
            stats.errored++;
            stats.errors.push({ entity: 'service', externalRef: item.id || item.externalRef, error: e.message });
          }
        }
      } else {
        stats.errors.push({ entity: 'services', error: `HTTP ${svcRes.status}: failed to fetch services` });
      }
    } catch (e) {
      stats.errors.push({ entity: 'services', error: e.message });
    }

    // ---- 3. Fetch relationships ----
    // TODO: confirm endpoint path with Next Insight API docs
    try {
      const relRes = await fetch(`${url}/api/v1/relationships`, { headers });
      if (relRes.ok) {
        const relData = await relRes.json();
        const relationships = Array.isArray(relData) ? relData : (relData.data || relData.items || []);
        for (const item of relationships) {
          try {
            const mapped = mapper.mapRelationship(item);
            if (!mapped) continue;
            const result = await upsertRelationship(db, mapped);
            stats[result.action]++;
          } catch (e) {
            stats.errored++;
            stats.errors.push({ entity: 'relationship', externalRef: item.id || item.externalRef, error: e.message });
          }
        }
      } else {
        stats.errors.push({ entity: 'relationships', error: `HTTP ${relRes.status}: failed to fetch relationships` });
      }
    } catch (e) {
      stats.errors.push({ entity: 'relationships', error: e.message });
    }

    return stats;
  },
};

const mapper = {
  mapApplication(item) {
    if (!item.id && !item.externalRef) return null;
    return {
      externalRef: String(item.id || item.externalRef),
      name: item.name || item.title || 'Unknown',
      description: item.description || null,
      ownerTeamId: item.ownerTeamId || item.teamId || null,
      lifecycleStatus: item.lifecycleStatus || item.status || 'active',
      environment: item.environment || null,
      classification: item.classification || null,
      vendor: item.vendor || null,
      version: item.version || null,
      appType: item.appType || item.applicationType || item.type || null,
      technologyStack: item.technologyStack || null,
    };
  },

  mapService(item) {
    if (!item.id && !item.externalRef) return null;
    return {
      externalRef: String(item.id || item.externalRef),
      name: item.name || item.title || 'Unknown',
      description: item.description || null,
      type: item.type || item.serviceType || 'business',
      ownerTeamId: item.ownerTeamId || item.teamId || null,
      lifecycleStatus: item.lifecycleStatus || item.status || 'active',
      environment: item.environment || null,
      classification: item.classification || null,
      businessCriticality: item.businessCriticality || item.criticality || null,
      businessOwner: item.businessOwner || item.owner || null,
      serviceTier: item.serviceTier || item.tier || null,
      supportModel: item.supportModel || null,
      serviceCategory: item.serviceCategory || item.category || null,
    };
  },

  mapRelationship(item) {
    if (!item.sourceType || !item.targetType || !item.sourceId || !item.targetId) return null;
    return {
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      targetType: item.targetType,
      targetId: item.targetId,
      relationshipType: item.relationshipType || item.type || 'depends_on',
      direction: item.direction || 'outbound',
      notes: item.notes || item.description || null,
    };
  },
};

export default connector;
