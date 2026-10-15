import assert from 'node:assert/strict';
import test from 'node:test';
import { approximateActivityTopics, classifyActivity, classifyClub } from '../scripts/topic-taxonomy.mjs';

test('спорные занятия входят в обе нужные группы', () => {
  assert.deepEqual(classifyActivity('Театр танца').sort(), ['dance', 'theatre']);
  assert.deepEqual(classifyActivity('Шахматы').sort(), ['clubs_games', 'mind_sports']);
});

test('известные ложные совпадения не возвращаются', () => {
  assert.deepEqual(classifyActivity('Хореография'), ['dance']);
  assert.deepEqual(classifyActivity('Курс «Сам себе кинолог»'), ['practical', 'learning']);
  assert.deepEqual(classifyActivity('Театральная мастерская'), ['theatre']);
  assert.deepEqual(classifyActivity('Аэробика и акробатика'), ['fitness']);
});

test('клуб наследует категории всех своих занятий без дублирования', () => {
  const result = classifyClub({activities:['Каратэ', 'Театр танца', 'Клуб молодой семьи']});
  assert.deepEqual(result.topics.sort(), ['community', 'sport', 'stage']);
  assert.deepEqual(result.subtopics.sort(), ['dance', 'family_support', 'martial_arts', 'theatre']);
});

test('занятия для молодёжи с ОВЗ относятся к социальным проектам', () => {
  assert.deepEqual(classifyActivity('Занятия для молодёжи с ОВЗ'), ['social_projects']);
  assert.deepEqual(classifyClub({activities:['Занятия для молодёжи с ОВЗ']}).topics, ['community']);
});

test('неясные занятия получают предварительные темы и остаются помеченными', () => {
  assert.deepEqual(classifyActivity('Индивидуальные консультации'), ['practical']);
  assert.deepEqual(classifyActivity('Студия «Горизонт»'), ['creative_other']);
  assert.deepEqual(classifyActivity('Школа аниматоров'), ['theatre']);
  assert.deepEqual(classifyActivity('Кинокомната'), ['cinema_sound']);
  assert.equal(Object.keys(approximateActivityTopics).length, 4);
  assert.ok(Object.values(approximateActivityTopics).every(record => record.reason));
});

test('настольный хоккей остаётся клубной игрой', () => {
  assert.deepEqual(classifyActivity('Настольный хоккей'), ['clubs_games']);
});
