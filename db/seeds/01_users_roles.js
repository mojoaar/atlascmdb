const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  await knex('user_roles').del();
  await knex('roles').del();
  await knex('sessions').del();
  await knex('users').del();

  const adminRoleId = uuidv4();
  const editorRoleId = uuidv4();
  const viewerRoleId = uuidv4();

  await knex('roles').insert([
    { id: adminRoleId, name: 'admin', description: 'Full system access' },
    { id: editorRoleId, name: 'editor', description: 'Can create and edit records' },
    { id: viewerRoleId, name: 'viewer', description: 'Read-only access' },
  ]);

  const passwordHash = await bcrypt.hash('password123', 10);

  const aliceId = uuidv4();
  const bobId = uuidv4();
  const carolId = uuidv4();
  const dianaId = uuidv4();
  const erikId = uuidv4();
  const frankId = uuidv4();

  await knex('users').insert([
    { id: aliceId, email: 'alice@atlas.local', passwordHash, displayName: 'Alice Admin', status: 'active' },
    { id: bobId, email: 'bob@atlas.local', passwordHash, displayName: 'Bob Editor', status: 'active', managerId: aliceId },
    { id: carolId, email: 'carol@atlas.local', passwordHash, displayName: 'Carol Viewer', status: 'active', managerId: aliceId },
    { id: dianaId, email: 'diana@atlas.local', passwordHash, displayName: 'Diana Developer', status: 'active', managerId: bobId },
    { id: erikId, email: 'erik@atlas.local', passwordHash, displayName: 'Erik Operator', status: 'active', managerId: carolId },
    { id: frankId, email: 'frank@atlas.local', passwordHash, displayName: 'Frank Analyst', status: 'active', managerId: bobId },
  ]);

  await knex('user_roles').insert([
    { userId: aliceId, roleId: adminRoleId },
    { userId: bobId, roleId: editorRoleId },
    { userId: carolId, roleId: viewerRoleId },
    { userId: dianaId, roleId: editorRoleId },
    { userId: erikId, roleId: viewerRoleId },
    { userId: frankId, roleId: editorRoleId },
  ]);
};
