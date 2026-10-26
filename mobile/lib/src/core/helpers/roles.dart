/// Mirrors backend/src/domain/roles.ts: the server stays the authority, this only hides actions.
const Map<String, Set<String>> _permissions = {
  'manager': {
    'dashboard:view',
    'parking:manage',
    'team:manage',
    'reservations:view',
    'reservations:manage',
    'reservations:force',
    'reservations:status',
    'revenue:view',
  },
  'agent': {'dashboard:view', 'reservations:view', 'reservations:manage', 'reservations:force', 'reservations:status'},
  'driver': {'dashboard:view', 'reservations:view', 'reservations:status'},
  'valet': {'dashboard:view', 'reservations:view', 'reservations:status'},
};

bool can(String? role, String permission) => role != null && (_permissions[role]?.contains(permission) ?? false);

/// Mirrors `allowedPosts` of backend/src/domain/roles.ts: the posts a role may hold for the day (the manager all four,
/// the agent the three of the floor). Used when the server sent no `allowedPosts` (an older API).
List<String> coveredPosts(String? role) => switch (role) {
  'manager' => const ['manager', 'agent', 'driver', 'valet'],
  'agent' => const ['agent', 'driver', 'valet'],
  'driver' => const ['driver'],
  'valet' => const ['valet'],
  _ => const [],
};
