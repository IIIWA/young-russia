// Field-specific provenance shared by the website and internal club-note view.
import {createHash} from 'node:crypto';
import {assertAllowedActivityIntake, assertClubActivitiesActive} from './activity-retirements.mjs';

const editorialFields = new Set(['description', 'vkUrl', 'officialUrl', 'registrationUrl']);
const descriptionItemField = /^(descriptionParagraphs|descriptionListItems)\/(0|[1-9]\d*)$/;
const isDescriptionField = field => field === 'description' || descriptionItemField.test(field);
export function editorialFieldValue(page, field) {
  const item = descriptionItemField.exec(field);
  if (item) return Array.isArray(page?.[item[1]]) ? page[item[1]][Number(item[2])] : undefined;
  return editorialFields.has(field) ? page?.[field] : undefined;
}
export function canonicalValueSha256(value) {
  const ordered = item => Array.isArray(item) ? item.map(ordered) : item && typeof item === 'object'
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key,ordered(item[key])])) : item;
  return createHash('sha256').update(JSON.stringify(ordered(value))).digest('hex');
}
function isHttpUrl(value) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
}

// Public catalog values stay small; internal evidence is attached only in memory.
export function attachApprovedActivityContent(club, approvals, catalogPath, clubIndex) {
  if (!club || !approvals) return club;
  assertClubActivitiesActive(club, catalogPath, approvals.retirements);
  const records = (approvals.records ?? []).filter(record => record.catalogFile === catalogPath && record.club === club.name && record.address === club.address);
  assertAllowedActivityIntake(records, approvals.retirements);
  if (!records.length) return club;
  const pages = (club.activityPages ?? []).map(page => ({...page, sourceRefs:[...(page.sourceRefs ?? [])]}));
  for (const record of records) {
    if (!(editorialFields.has(record.field) || descriptionItemField.test(record.field)) || !Array.isArray(record.sourceRefs) || !record.sourceRefs.length
      || record.sourceRefs.some(ref => ref.field !== record.field)) throw new Error(`Invalid approved field binding: ${record.route}`);
    if (clubIndex !== undefined && record.clubIndex !== clubIndex) throw new Error(`Approved club index drift: ${catalogPath}/${club.name}`);
    const page = pages[record.activityPageIndex];
    if (!(club.activities ?? []).includes(record.activity)) throw new Error(`Approved content targets an inactive direction: ${record.route}`);
    const value = editorialFieldValue(page, record.field);
    if (page?.catalogActivity !== record.activity || typeof value !== 'string'
      || createHash('sha256').update(value).digest('hex') !== record.valueSha256
      || (!isDescriptionField(record.field) && !isHttpUrl(value))) {
      throw new Error(`Approved activity field drift: ${record.route}/${record.field}`);
    }
    page.sourceRefs.push(...record.sourceRefs);
    if (record.presentation) {
      const {label, kind} = record.presentation;
      if (record.field !== 'officialUrl' || typeof label !== 'string' || !label.trim()
        || !['official-section-anchor', 'official-direction-page'].includes(kind)
        || (kind === 'official-section-anchor' && !new URL(value).hash)) {
        throw new Error(`Invalid approved link presentation: ${record.route}`);
      }
      page.officialUrlLabel = label;
      page.officialUrlKind = kind;
    }
  }
  return {...club, activityPages:pages};
}

export function approvedFieldRef(page, field) {
  const value = editorialFieldValue(page, field);
  if (typeof value !== 'string' || !value.trim()
    || (!isDescriptionField(field) && !isHttpUrl(value))) return undefined;
  return page.sourceRefs?.find(ref => ref.field === field && ref.task === 'ACTIVITY-CONTENT-2026-11-10'
    && isHttpUrl(ref.sourceUrl) && ref.sourceFile && ref.locator
    && Object.hasOwn(ref, 'checkedAt') && (ref.checkedAt === null || typeof ref.checkedAt === 'string' && ref.checkedAt.trim())
    && /^[a-f0-9]{64}$/.test(ref.sha256 ?? '') && ref.acceptance?.file && ref.acceptance?.locator);
}

export function approvedDescriptionParts(page) {
  const parts = field => Array.isArray(page[field]) ? page[field].flatMap((value, index) => {
    const ref = approvedFieldRef(page, `${field}/${index}`);
    return ref ? [{text:value.trim(), ref}] : [];
  }) : [];
  return {paragraphs:parts('descriptionParagraphs'), listItems:parts('descriptionListItems')};
}

export function activityDescriptions(pages) {
  const seen = new Set();
  return pages.flatMap(item => {
    const ref = approvedFieldRef(item, 'description');
    if (!ref) return [];
    const description = {text:item.description.trim(), sourceUrl:ref.sourceUrl, title:item.title || item.catalogActivity};
    const parts = approvedDescriptionParts(item);
    const publicParts = entries => entries.map(part => ({text:part.text, sourceUrl:part.ref.sourceUrl}));
    if (parts.paragraphs.length) description.paragraphs = publicParts(parts.paragraphs);
    if (parts.listItems.length) description.listItems = publicParts(parts.listItems);
    const key = JSON.stringify([description.text, description.sourceUrl, description.paragraphs, description.listItems]);
    if (seen.has(key)) return [];
    seen.add(key);
    return [description];
  });
}

export function approvedOfficialLinkPresentation(page) {
  if (!approvedFieldRef(page, 'officialUrl') || !page.officialUrlLabel
    || !['official-section-anchor', 'official-direction-page'].includes(page.officialUrlKind)) return undefined;
  return {label:page.officialUrlLabel, kind:page.officialUrlKind};
}
