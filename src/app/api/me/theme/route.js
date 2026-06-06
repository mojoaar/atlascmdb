import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError, success, guardResponse } from '../../../../lib/api-helpers';

async function loadAdminColumnDefaults(db) {
  const rows = await db('app_config').where('key', 'like', 'column_default_%').orWhere('key', 'row_limit_default').orWhere('key', 'attachment_allowed_types').select('key', 'value');
  const defaults = {};
  for (const row of rows) {
    if (row.key === 'row_limit_default') {
      defaults._rowLimit = parseInt(row.value) || 100;
    } else if (row.key === 'attachment_allowed_types') {
      defaults._attachmentTypes = row.value;
    } else {
      const entityType = row.key.replace('column_default_', '');
      try { defaults[entityType] = JSON.parse(row.value); } catch {}
    }
  }
  return defaults;
}

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const pref = await db('user_theme_preferences')
      .leftJoin('themes', 'user_theme_preferences.themeId', 'themes.id')
      .where('user_theme_preferences.userId', auth.user.id)
      .select('user_theme_preferences.*', 'themes.name as themeName')
      .first();

    if (!pref) {
      const defaultTheme = await db('themes').where({ isDefault: true }).first();
      const adminDefaults = await loadAdminColumnDefaults(db);
      return success({
        themeId: defaultTheme?.id,
        modePreference: 'light',
        themeName: defaultTheme?.name,
        timezone: 'Europe/Copenhagen',
        clockFormat: '24h',
        dateFormat: 'DD/MM/YYYY',
        graphDepth: 3,
        columnPrefs: {},
        notifOnCreate: true,
        notifOnUpdate: true,
        notifOnDelete: true,
        adminColumnDefaults: adminDefaults,
      });
    }

    const adminDefaults = await loadAdminColumnDefaults(db);
    const result = {
      ...pref,
      notifOnCreate: pref.notifOnCreate !== undefined ? !!pref.notifOnCreate : true,
      notifOnUpdate: pref.notifOnUpdate !== undefined ? !!pref.notifOnUpdate : true,
      notifOnDelete: pref.notifOnDelete !== undefined ? !!pref.notifOnDelete : true,
      adminColumnDefaults: adminDefaults
    };
    return success(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { themeId, modePreference, timezone, clockFormat, dateFormat, graphDepth, columnPrefs, rowLimit, notifOnCreate, notifOnUpdate, notifOnDelete } = await request.json();

    const existing = await db('user_theme_preferences').where({ userId: auth.user.id }).first();

    if (existing) {
      const updates = { updatedAt: new Date().toISOString() };
      if (themeId !== undefined) updates.themeId = themeId;
      if (modePreference !== undefined) updates.modePreference = modePreference;
      if (timezone !== undefined) updates.timezone = timezone;
      if (clockFormat !== undefined) updates.clockFormat = clockFormat;
      if (dateFormat !== undefined) updates.dateFormat = dateFormat;
      if (graphDepth !== undefined) updates.graphDepth = parseInt(graphDepth);
      if (rowLimit !== undefined) updates.rowLimit = parseInt(rowLimit) || null;
      if (columnPrefs !== undefined) updates.columnPrefs = typeof columnPrefs === 'string' ? columnPrefs : JSON.stringify(columnPrefs);
      if (notifOnCreate !== undefined) updates.notifOnCreate = notifOnCreate ? 1 : 0;
      if (notifOnUpdate !== undefined) updates.notifOnUpdate = notifOnUpdate ? 1 : 0;
      if (notifOnDelete !== undefined) updates.notifOnDelete = notifOnDelete ? 1 : 0;
      await db('user_theme_preferences').where({ userId: auth.user.id }).update(updates);
    } else {
      await db('user_theme_preferences').insert({
        id: uuidv4(),
        userId: auth.user.id,
        themeId: themeId || (await db('themes').where({ isDefault: true }).first())?.id,
        modePreference: modePreference || 'light',
        timezone: timezone || 'Europe/Copenhagen',
        clockFormat: clockFormat || '24h',
        dateFormat: dateFormat || 'DD/MM/YYYY',
        graphDepth: parseInt(graphDepth) || 3,
        rowLimit: rowLimit ? parseInt(rowLimit) : null,
        columnPrefs: columnPrefs ? (typeof columnPrefs === 'string' ? columnPrefs : JSON.stringify(columnPrefs)) : null,
        notifOnCreate: notifOnCreate !== undefined ? (notifOnCreate ? 1 : 0) : 1,
        notifOnUpdate: notifOnUpdate !== undefined ? (notifOnUpdate ? 1 : 0) : 1,
        notifOnDelete: notifOnDelete !== undefined ? (notifOnDelete ? 1 : 0) : 1,
      });
    }

    return success({ themeId, modePreference, timezone, clockFormat, dateFormat, graphDepth, notifOnCreate, notifOnUpdate, notifOnDelete });
  } catch (error) {
    return handleApiError(error);
  }
}
