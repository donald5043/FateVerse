import type { BaziPillar, BaziRelation, ElementName } from '../types/fate';

interface RelationRule {
  members: string[];
  label: string;
  element?: ElementName;
}

const STEM_COMBINATIONS: RelationRule[] = [
  { members: ['甲', '己'], label: '天干五合', element: 'earth' },
  { members: ['乙', '庚'], label: '天干五合', element: 'metal' },
  { members: ['丙', '辛'], label: '天干五合', element: 'water' },
  { members: ['丁', '壬'], label: '天干五合', element: 'wood' },
  { members: ['戊', '癸'], label: '天干五合', element: 'fire' },
];

const BRANCH_RULES: Array<RelationRule & { kind: BaziRelation['kind'] }> = [
  ...[['子', '丑', 'earth'], ['寅', '亥', 'wood'], ['卯', '戌', 'fire'], ['辰', '酉', 'metal'], ['巳', '申', 'water'], ['午', '未', 'earth']].map(([first, second, element]) => ({ members: [first, second], label: '地支六合', kind: 'branch-six-harmony' as const, element: element as ElementName })),
  ...[['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']].map((members) => ({ members, label: '地支六沖', kind: 'branch-clash' as const })),
  ...[['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']].map((members) => ({ members, label: '地支六害', kind: 'branch-harm' as const })),
  ...[['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌']].map((members) => ({ members, label: '地支六破', kind: 'branch-break' as const })),
  ...[['申', '子', '辰', 'water'], ['亥', '卯', '未', 'wood'], ['寅', '午', '戌', 'fire'], ['巳', '酉', '丑', 'metal']].map(([first, second, third, element]) => ({ members: [first, second, third], label: '地支三合', kind: 'branch-three-harmony' as const, element: element as ElementName })),
  ...[['亥', '子', '丑', 'water'], ['寅', '卯', '辰', 'wood'], ['巳', '午', '未', 'fire'], ['申', '酉', '戌', 'metal']].map(([first, second, third, element]) => ({ members: [first, second, third], label: '地支三會', kind: 'branch-three-meeting' as const, element: element as ElementName })),
  ...[['寅', '巳', '申'], ['丑', '未', '戌'], ['子', '卯']].map((members) => ({ members, label: '地支相刑', kind: 'branch-punishment' as const })),
];

const SELF_PUNISHMENTS = ['辰', '午', '酉', '亥'];

function includesMembers(values: string[], members: string[]): boolean {
  return members.every((member) => values.includes(member));
}

function labelsFor(pillars: BaziPillar[], field: 'stem' | 'branch', members: string[]): string[] {
  return pillars.filter((pillar) => members.includes(pillar[field])).map((pillar) => pillar.label);
}

export function calculateBaziRelations(pillars: BaziPillar[]): BaziRelation[] {
  const stems = pillars.map((pillar) => pillar.stem);
  const branches = pillars.map((pillar) => pillar.branch);
  const relations: BaziRelation[] = [];

  for (const rule of STEM_COMBINATIONS) {
    if (!includesMembers(stems, rule.members)) continue;
    relations.push({
      kind: 'stem-combination', label: rule.label, members: rule.members,
      pillarLabels: labelsFor(pillars, 'stem', rule.members), element: rule.element,
      note: '合象成立不等於必然化氣，仍需配合月令、透干與整體強弱判讀。',
    });
  }

  for (const rule of BRANCH_RULES) {
    if (!includesMembers(branches, rule.members)) continue;
    relations.push({
      kind: rule.kind, label: rule.label, members: rule.members,
      pillarLabels: labelsFor(pillars, 'branch', rule.members), element: rule.element,
      note: rule.kind.includes('harmony') || rule.kind === 'branch-three-meeting'
        ? '呈現彼此牽動與聚合的傳統結構，不單獨視為吉。'
        : '呈現彼此牽動或張力的傳統結構，不單獨視為凶。',
    });
  }

  for (const branch of SELF_PUNISHMENTS) {
    const matches = pillars.filter((pillar) => pillar.branch === branch);
    if (matches.length < 2) continue;
    relations.push({
      kind: 'branch-punishment', label: '地支自刑', members: [branch, branch],
      pillarLabels: matches.map((pillar) => pillar.label),
      note: '同支重見形成自刑資料點，需與全局配置共同閱讀，不作性格定論。',
    });
  }

  return relations;
}
