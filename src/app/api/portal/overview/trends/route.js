import getDb from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/rbac';
import { handleApiError, success, guardResponse } from '../../../../../lib/api-helpers';

export async function GET(request) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();

    const [svcCount] = await db('service_base').count('* as total');
    const [appCount] = await db('application_base').count('* as total');
    const [ciCount] = await db('ci_base').count('* as total');
    const [assetCount] = await db('assets').count('* as total');
    const [teamCount] = await db('teams').count('* as total');
    const [locCount] = await db('locations').count('* as total');
    const [userCount] = await db('users').count('* as total');

    const distribution = [
      { name: 'Services', value: Number(svcCount.total), color: '#003d7a' },
      { name: 'Applications', value: Number(appCount.total), color: '#c8102e' },
      { name: 'CIs', value: Number(ciCount.total), color: '#2e7d32' },
      { name: 'Assets', value: Number(assetCount.total), color: '#ed6c02' },
      { name: 'Teams', value: Number(teamCount.total), color: '#4d8cc7' },
      { name: 'Locations', value: Number(locCount.total), color: '#e0556b' },
      { name: 'Users', value: Number(userCount.total), color: '#7b6faf' },
    ];

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoff = sixMonthsAgo.toISOString();

    const isPg = db.client.config.client === 'pg' || db.client.config.client === 'postgresql';
    const monthExpr = isPg ? "to_char(\"createdAt\", 'YYYY-MM')" : "strftime('%Y-%m', createdAt)";

    const activity = await db('audit_events')
      .select(db.raw(`${monthExpr} as month`))
      .count('* as total')
      .where('createdAt', '>=', cutoff)
      .groupByRaw(monthExpr)
      .orderBy('month');

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const found = activity.find(a => a.month === key);
      months.push({ month: key, activities: found ? Number(found.total) : 0 });
    }

    const [businessSvcs] = await db('business_services').count('* as total');
    const [technicalSvcs] = await db('technical_services').count('* as total');

    const serviceTypeBreakdown = [
      { name: 'Business', value: Number(businessSvcs.total), color: '#003d7a' },
      { name: 'Technical', value: Number(technicalSvcs.total), color: '#4d8cc7' },
    ];

    return success({
      distribution,
      monthlyActivity: months,
      serviceTypeBreakdown,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
