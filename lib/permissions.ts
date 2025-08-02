import { executeQuery } from './database';

export interface ModulePermission {
  module_name: string;
  permissions: string[];
}

// Check if user has specific permission for a module
export async function checkUserPermission(
  userId: string,
  userRole: string,
  moduleName: string,
  permissionName: string
): Promise<boolean> {
  try {
    // CEO has access to everything
    if (userRole === 'ceo' || userRole === 'مدیر') {
      return true;
    }

    // Check user permission
    const [result] = await executeQuery(`
      SELECT ump.granted
      FROM user_module_permissions ump
      JOIN modules m ON ump.module_id = m.id
      JOIN permissions p ON ump.permission_id = p.id
      WHERE ump.user_id = ? 
        AND m.name = ? 
        AND p.name = ?
        AND ump.granted = true
      LIMIT 1
    `, [userId, moduleName, permissionName]);

    return !!result?.granted;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// Get user's all accessible modules with their permissions
export async function getUserModulePermissions(userId: string, userRole: string): Promise<ModulePermission[]> {
  try {
    // CEO has access to all modules with all permissions
    if (userRole === 'ceo' || userRole === 'مدیر') {
      const modules = await executeQuery(`
        SELECT m.name as module_name, 'manage' as permission_name
        FROM modules m
        WHERE m.is_active = true
      `);

      const moduleMap: { [key: string]: string[] } = {};
      modules.forEach((row: any) => {
        if (!moduleMap[row.module_name]) {
          moduleMap[row.module_name] = [];
        }
        moduleMap[row.module_name].push(row.permission_name);
      });

      return Object.keys(moduleMap).map(moduleName => ({
        module_name: moduleName,
        permissions: moduleMap[moduleName]
      }));
    }

    // Get regular user permissions
    const userPermissions = await executeQuery(`
      SELECT 
        m.name as module_name,
        p.name as permission_name
      FROM user_module_permissions ump
      JOIN modules m ON ump.module_id = m.id
      JOIN permissions p ON ump.permission_id = p.id
      WHERE ump.user_id = ? 
        AND ump.granted = true
        AND m.is_active = true
      ORDER BY m.name, p.name
    `, [userId]);

    const moduleMap: { [key: string]: string[] } = {};
    userPermissions.forEach((row: any) => {
      if (!moduleMap[row.module_name]) {
        moduleMap[row.module_name] = [];
      }
      moduleMap[row.module_name].push(row.permission_name);
    });

    return Object.keys(moduleMap).map(moduleName => ({
      module_name: moduleName,
      permissions: moduleMap[moduleName]
    }));
  } catch (error) {
    console.error('Get user module permissions error:', error);
    return [];
  }
}

// Route to module mapping for permission checks
export const ROUTE_MODULE_MAP: { [key: string]: string } = {
  '/dashboard': 'dashboard',
  '/dashboard/customers': 'customers',
  '/dashboard/sales': 'deals',
  '/dashboard/interactions': 'tickets',
  '/dashboard/activities': 'activities',
  '/dashboard/tasks': 'tasks',
  '/dashboard/projects': 'projects',
  '/dashboard/calendar': 'calendar',
  '/dashboard/reports': 'reports',
  '/dashboard/insights': 'analytics',
  '/dashboard/feedback': 'feedback',
  '/dashboard/surveys': 'surveys',
  '/dashboard/settings': 'settings',
  '/dashboard/coworkers': 'users',
};