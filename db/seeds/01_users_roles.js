const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

function makeRng(seed) {
  let s = seed || 42;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

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

  const users = [
    { id: aliceId, email: 'alice@atlas.local', passwordHash, displayName: 'Alice Admin', status: 'active' },
    { id: bobId, email: 'bob@atlas.local', passwordHash, displayName: 'Bob Editor', status: 'active', managerId: aliceId },
    { id: carolId, email: 'carol@atlas.local', passwordHash, displayName: 'Carol Viewer', status: 'active', managerId: aliceId },
    { id: dianaId, email: 'diana@atlas.local', passwordHash, displayName: 'Diana Developer', status: 'active', managerId: bobId },
    { id: erikId, email: 'erik@atlas.local', passwordHash, displayName: 'Erik Operator', status: 'active', managerId: carolId },
    { id: frankId, email: 'frank@atlas.local', passwordHash, displayName: 'Frank Analyst', status: 'active', managerId: bobId },
  ];

  const userRoles = [
    { userId: aliceId, roleId: adminRoleId },
    { userId: bobId, roleId: editorRoleId },
    { userId: carolId, roleId: viewerRoleId },
    { userId: dianaId, roleId: editorRoleId },
    { userId: erikId, roleId: viewerRoleId },
    { userId: frankId, roleId: editorRoleId },
  ];

  const rng = makeRng(101);

  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

  // Add 24 extra users to get exactly 30 users in total
  const createdEmails = new Set(users.map(u => u.email));
  while (users.length < 30) {
    const fn = firstNames[Math.floor(rng() * firstNames.length)];
    const ln = lastNames[Math.floor(rng() * lastNames.length)];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@atlas.local`;
    if (createdEmails.has(email)) continue;
    createdEmails.add(email);

    const id = uuidv4();
    // Pick manager from the first 6 users
    const manager = users[Math.floor(rng() * 6)];
    
    users.push({
      id,
      email,
      passwordHash,
      displayName: `${fn} ${ln}`,
      status: 'active',
      managerId: manager.id,
    });

    // Assign roles: 5% Admin, 45% Editor, 50% Viewer
    const roll = rng();
    let assignedRoleId = viewerRoleId;
    if (roll < 0.05) {
      assignedRoleId = adminRoleId;
    } else if (roll < 0.50) {
      assignedRoleId = editorRoleId;
    }
    userRoles.push({
      userId: id,
      roleId: assignedRoleId,
    });
  }

  await knex('users').insert(users);
  await knex('user_roles').insert(userRoles);
};
