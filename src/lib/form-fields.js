const CI_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

const SERVICE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing' },
  { value: 'production', label: 'Production' },
  { value: 'retired', label: 'Retired' },
  { value: 'archived', label: 'Archived' },
];

const APP_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing' },
  { value: 'production', label: 'Production' },
  { value: 'retired', label: 'Retired' },
];

const SERVICE_ENV_OPTIONS = [
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
  { value: 'dr', label: 'Disaster Recovery' },
];

const APP_ENV_OPTIONS = [
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];

const CI_ENV_OPTIONS = [
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];

const CLASSIFICATION_OPTIONS = [
  { value: 'internal', label: 'Internal' },
  { value: 'confidential', label: 'Confidential' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'public', label: 'Public' },
];

const CI_TYPE_OPTIONS = [
  { value: 'server', label: 'Server' },
  { value: 'network_device', label: 'Network Device' },
  { value: 'storage', label: 'Storage' },
  { value: 'database', label: 'Database' },
  { value: 'container', label: 'Container' },
  { value: 'other', label: 'Other' },
];

const BUSINESS_CRITICALITY = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SERVICE_TIER = [
  { value: 'tier1', label: 'Tier 1' },
  { value: 'tier2', label: 'Tier 2' },
  { value: 'tier3', label: 'Tier 3' },
  { value: 'tier4', label: 'Tier 4' },
];

const SUPPORT_MODEL = [
  { value: '24x7', label: '24x7' },
  { value: 'business_hours', label: 'Business Hours' },
  { value: 'best_effort', label: 'Best Effort' },
];

const ASSET_CATEGORY_OPTIONS = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'license', label: 'License' },
  { value: 'network', label: 'Network' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'other', label: 'Other' },
];

const ASSET_STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'in_use', label: 'In Use' },
  { value: 'retired', label: 'Retired' },
  { value: 'disposed', label: 'Disposed' },
  { value: 'rma', label: 'RMA' },
];

export const ENTITY_FIELDS = {
  ci: [
    { id: 'name', label: 'Name', type: 'text', required: true, description: 'Unique name of the Configuration Item' },
    { id: 'description', label: 'Description', type: 'text', description: 'Free-text description of the CI' },
    { id: 'ownerTeamId', label: 'Owner Team', type: 'select', optionsRef: 'teams', description: 'Team responsible for this CI' },
    { id: 'locationId', label: 'Location', type: 'select', optionsRef: 'locations', description: 'Physical or logical location where the CI resides' },
    { id: 'lifecycleStatus', label: 'Lifecycle Status', type: 'select', options: CI_STATUS_OPTIONS, description: 'Current operational state of the CI' },
    { id: 'environment', label: 'Environment', type: 'select', options: CI_ENV_OPTIONS, description: 'Deployment environment (development, staging, production)' },
    { id: 'classification', label: 'Classification', type: 'select', options: CLASSIFICATION_OPTIONS, description: 'Data sensitivity classification level' },
    { id: 'externalRef', label: 'External Reference', type: 'text', description: 'External reference ID from source systems (e.g., ServiceNow CMDB ID)' },
    { id: 'ciType', label: 'CI Type', type: 'select', options: CI_TYPE_OPTIONS, description: 'Type of CI — server, network device, storage, database, container, or other' },
    { id: 'serialNumber', label: 'Serial Number', type: 'text', description: 'Manufacturer serial number' },
    { id: 'assetTag', label: 'Asset Tag', type: 'text', description: 'Organization-assigned asset tracking tag' },
  ],

  service: [
    { id: 'name', label: 'Name', type: 'text', required: true, description: 'Name of the service' },
    { id: 'description', label: 'Description', type: 'text', description: 'Description of what the service does' },
    { id: 'ownerTeamId', label: 'Owner Team', type: 'select', optionsRef: 'teams', description: 'Team that owns and manages the service' },
    { id: 'lifecycleStatus', label: 'Lifecycle Status', type: 'select', options: SERVICE_STATUS_OPTIONS, description: 'Current lifecycle stage (active, development, testing, production, retired, archived)' },
    { id: 'environment', label: 'Environment', type: 'select', options: SERVICE_ENV_OPTIONS, description: 'Deployment environment (development, staging, production, disaster recovery)' },
    { id: 'classification', label: 'Classification', type: 'select', options: CLASSIFICATION_OPTIONS, description: 'Data sensitivity classification level' },
    { id: 'businessCriticality', label: 'Business Criticality', type: 'select', options: BUSINESS_CRITICALITY, description: 'How critical the service is to business operations (critical, high, medium, low)' },
    { id: 'businessOwner', label: 'Business Owner', type: 'text', description: 'Person accountable for the business value of the service' },
    { id: 'serviceTier', label: 'Service Tier', type: 'select', options: SERVICE_TIER, description: 'Service level tier (tier1-tier4) determining priority and support response' },
    { id: 'supportModel', label: 'Support Model', type: 'select', options: SUPPORT_MODEL, description: 'Support coverage model (24x7, business_hours, best_effort)' },
    { id: 'serviceCategory', label: 'Service Category', type: 'text', description: 'Free-text category for grouping similar services' },
  ],

  application: [
    { id: 'name', label: 'Name', type: 'text', required: true, description: 'Name of the application' },
    { id: 'description', label: 'Description', type: 'text', description: 'Description of the application\'s purpose' },
    { id: 'ownerTeamId', label: 'Owner Team', type: 'select', optionsRef: 'teams', description: 'Team that owns the application' },
    { id: 'lifecycleStatus', label: 'Lifecycle Status', type: 'select', options: APP_STATUS_OPTIONS, description: 'Current lifecycle stage (active, development, testing, production, retired)' },
    { id: 'environment', label: 'Environment', type: 'select', options: APP_ENV_OPTIONS, description: 'Deployment environment (development, staging, production)' },
    { id: 'classification', label: 'Classification', type: 'select', options: CLASSIFICATION_OPTIONS, description: 'Data sensitivity classification level' },
    { id: 'vendor', label: 'Vendor', type: 'text', description: 'Software vendor or creator (e.g., In-House, Microsoft, Oracle)' },
    { id: 'version', label: 'Version', type: 'text', description: 'Current deployed version number' },
    { id: 'appType', label: 'Application Type', type: 'text', description: 'Type of application (e.g., Web, Mobile, Desktop, API)' },
    { id: 'technologyStack', label: 'Technology Stack', type: 'text', description: 'Technology stack used (e.g., Node.js, Python, Java, .NET)' },
  ],

  asset: [
    { id: 'name', label: 'Name', type: 'text', required: true, description: 'Name or label of the asset' },
    { id: 'assetTag', label: 'Asset Tag', type: 'text', description: 'Unique asset tracking tag or barcode identifier' },
    { id: 'model', label: 'Model', type: 'text', description: 'Hardware or software model identifier' },
    { id: 'category', label: 'Category', type: 'select', options: ASSET_CATEGORY_OPTIONS, description: 'Asset category (hardware, software, license, network, furniture, other)' },
    { id: 'status', label: 'Status', type: 'select', options: ASSET_STATUS_OPTIONS, description: 'Asset operational status (in_stock, in_use, retired, disposed, rma)' },
    { id: 'ciId', label: 'CI', type: 'select', optionsRef: 'cis', description: 'Associated Configuration Item this asset relates to' },
    { id: 'locationId', label: 'Location', type: 'select', optionsRef: 'locations', description: 'Physical location where the asset is stored or deployed' },
    { id: 'assignedTo', label: 'Assigned To', type: 'select', optionsRef: 'users', description: 'User currently assigned the asset' },
    { id: 'supplier', label: 'Supplier', type: 'text', description: 'Vendor or supplier name' },
    { id: 'purchaseDate', label: 'Purchase Date', type: 'text', inputType: 'date', description: 'Date the asset was purchased' },
    { id: 'warrantyExpiry', label: 'Warranty Expiry', type: 'text', inputType: 'date', description: 'Date the warranty coverage expires' },
    { id: 'cost', label: 'Cost', type: 'text', inputType: 'number', description: 'Purchase or replacement cost in local currency' },
    { id: 'notes', label: 'Notes', type: 'text', inputType: 'textarea', description: 'Free-text notes about the asset' },
  ],
};

export const DEFAULT_LAYOUTS = {
  ci: {
    sections: [
      {
        id: 'general',
        title: 'General',
        columns: 1,
        visible: true,
        fields: ['name', 'description', 'ownerTeamId', 'locationId', 'lifecycleStatus', 'environment', 'classification', 'externalRef'],
      },
      {
        id: 'ci_details',
        title: 'CI Details',
        columns: 1,
        visible: true,
        fields: ['ciType', 'serialNumber', 'assetTag'],
      },
    ],
    componentSections: [
      { id: 'relationships', title: 'Relationships', visible: true },
      { id: 'audit_trail', title: 'Audit Trail', visible: true },
    ],
  },

  service: {
    sections: [
      {
        id: 'general',
        title: 'General',
        columns: 1,
        visible: true,
        fields: ['name', 'description', 'ownerTeamId', 'lifecycleStatus', 'environment', 'classification'],
      },
      {
        id: 'business_details',
        title: 'Business Service Details',
        columns: 1,
        visible: true,
        fields: ['businessCriticality', 'businessOwner', 'serviceTier'],
      },
      {
        id: 'technical_details',
        title: 'Technical Service Details',
        columns: 1,
        visible: true,
        fields: ['supportModel', 'serviceCategory'],
      },
    ],
    componentSections: [
      { id: 'relationships', title: 'Relationships', visible: true },
      { id: 'audit_trail', title: 'Audit Trail', visible: true },
    ],
  },

  application: {
    sections: [
      {
        id: 'general',
        title: 'General',
        columns: 1,
        visible: true,
        fields: ['name', 'description', 'ownerTeamId', 'lifecycleStatus', 'environment', 'classification'],
      },
      {
        id: 'details',
        title: 'Details',
        columns: 1,
        visible: true,
        fields: ['vendor', 'version', 'appType', 'technologyStack'],
      },
    ],
    componentSections: [
      { id: 'relationships', title: 'Relationships', visible: true },
      { id: 'audit_trail', title: 'Audit Trail', visible: true },
    ],
  },

  asset: {
    sections: [
      {
        id: 'general',
        title: 'General',
        columns: 2,
        visible: true,
        fields: ['name', 'assetTag', 'model', 'category', 'status', 'ciId', 'locationId', 'assignedTo'],
      },
      {
        id: 'procurement',
        title: 'Procurement',
        columns: 2,
        visible: true,
        fields: ['supplier', 'purchaseDate', 'warrantyExpiry', 'cost'],
      },
      {
        id: 'notes',
        title: 'Notes',
        columns: 1,
        visible: true,
        fields: ['notes'],
      },
    ],
    componentSections: [
      { id: 'attachments', title: 'Attachments', visible: true },
      { id: 'relationships', title: 'Relationships', visible: true },
      { id: 'audit_trail', title: 'Audit Trail', visible: true },
    ],
  },
};

export function getField(entityType, fieldId) {
  return (ENTITY_FIELDS[entityType] || []).find(f => f.id === fieldId);
}

export function getEntityFields(entityType) {
  return ENTITY_FIELDS[entityType] || [];
}

export function getDefaultLayout(entityType) {
  return DEFAULT_LAYOUTS[entityType] || { sections: [], componentSections: [] };
}
