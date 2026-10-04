/// Mirrors backend/src/domain/roles.ts: the server stays the authority, this only hides actions.
const Map<String, Set<String>> _permissions = {
  'manager': {'dashboard:view', 'parking:manage', 'team:manage', 'reservations:view', 'reservations:manage', 'reservations:force', 'reservations:status'},
  'agent': {'dashboard:view', 'reservations:view', 'reservations:manage', 'reservations:force', 'reservations:status'},
  'driver': {'dashboard:view', 'reservations:view', 'reservations:status'},
  'valet': {'dashboard:view', 'reservations:view', 'reservations:status'},
};

bool can(String? role, String permission) => role != null && (_permissions[role]?.contains(permission) ?? false);
