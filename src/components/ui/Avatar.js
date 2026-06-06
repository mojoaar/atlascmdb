'use client';

export default function Avatar({ user, size = 40 }) {
  if (!user) return null;

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          background: user.avatarBg || '#003d7a',
        }}
      />
    );
  }

  const initials = (user.displayName || user.email || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: user.avatarBg || '#003d7a',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.4,
      fontWeight: 600,
      userSelect: 'none',
    }}>
      {initials}
    </div>
  );
}
