const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  // Clear existing attachments first
  await knex('asset_attachments').del();

  // Find five assets
  const assets = await knex('assets').select('id', 'name').limit(5);

  const attachments = [
    {
      filename: 'device_specs.pdf',
      mimeType: 'application/pdf',
      data: Buffer.from('%PDF-1.5 %... PDF placeholder data ...'),
    },
    {
      filename: 'rack_diagram.png',
      mimeType: 'image/png',
      data: Buffer.from('\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR... PNG placeholder data ...'),
    },
    {
      filename: 'configuration_notes.txt',
      mimeType: 'text/plain',
      data: Buffer.from('Host: prod-web-01\nOS: Windows Server 2022\nNotes: Configured with IIS and .NET 8.0'),
    },
    {
      filename: 'network_audit.csv',
      mimeType: 'text/csv',
      data: Buffer.from('Port,Status,VLAN,Description\n1,Connected,10,Web Traffic\n2,Disconnected,20,Database\n'),
    },
    {
      filename: 'backup_settings.json',
      mimeType: 'application/json',
      data: Buffer.from(JSON.stringify({ backup_interval: 'daily', retention_days: 30, compression: true }, null, 2)),
    },
  ];

  for (let i = 0; i < Math.min(assets.length, attachments.length); i++) {
    const asset = assets[i];
    const attachment = attachments[i];

    await knex('asset_attachments').insert({
      id: uuidv4(),
      assetId: asset.id,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.data.length,
      data: attachment.data,
    });
  }
};
