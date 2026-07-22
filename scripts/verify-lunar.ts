import { Solar } from 'lunar-javascript';

const solar = Solar.fromYmdHms(1990, 1, 2, 0, 0, 0);
const lunar = solar.getLunar();
const eightChar = lunar.getEightChar();
const pillars = [eightChar.getYear(), eightChar.getMonth(), eightChar.getDay(), eightChar.getTime()];

if (pillars.some((pillar) => !/^[\p{Script=Han}]{2}$/u.test(pillar))) {
  throw new Error(`lunar-javascript 四柱輸出異常：${pillars.join(' ')}`);
}

console.log(`lunar-javascript OK：1990-01-02 00:00 → ${pillars.join(' ')}`);
