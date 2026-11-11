const normalizedRoute = value => String(value ?? '').replace(/^\/+/, '');

export function assertAllowedActivityIntake(records, retirements = {records:[]}) {
  for (const item of records) for (const retired of retirements.records ?? []) {
    const sameIdentity = (item.catalogFile ?? item.catalogIdentity?.file) === retired.catalogFile
      && (item.club ?? item.catalogIdentity?.club) === retired.club
      && (item.address ?? item.catalogIdentity?.address) === retired.address
      && item.activity === retired.activity;
    if (normalizedRoute(item.route) === retired.route || sameIdentity) throw new Error(`Retired activity cannot be imported: ${retired.route}`);
  }
}

export function assertClubActivitiesActive(club, catalogPath, retirements = {records:[]}) {
  for (const retired of retirements.records ?? []) {
    if (retired.catalogFile !== catalogPath || retired.club !== club.name || retired.address !== club.address) continue;
    if ((club.activities ?? []).includes(retired.activity)
      || (club.activityPages ?? []).some(page => page.catalogActivity === retired.activity)
      || (club.activitySchedule ?? []).some(record => record.activity === retired.activity)) {
      throw new Error(`Retired activity remains active: ${retired.route}`);
    }
  }
  return club;
}
