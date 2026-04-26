/**
 * Centralized role definitions for the application.
 * Add new roles here to have them automatically appear in the Admin Panel.
 */
export const AVAILABLE_ROLES = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full site access and user management permissions.",
  },
  {
    id: "content-creator",
    name: "Content Creator",
    description: "Ability to manage products, catalog, and store content.",
  },
];

export const getRoleIds = () => AVAILABLE_ROLES.map((r) => r.id);
