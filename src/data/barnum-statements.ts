export type ColdReadingTechnique =
  | 'rainbow-ruse'
  | 'fine-flattery'
  | 'barnum-statement'
  | 'vague-universal'
  | 'safe-question'
  | 'high-probability-guess'
  | 'sub-typing';

export interface BarnumStatement {
  id: string;
  text: string;
  technique: ColdReadingTechnique;
}

export interface TechniqueInfo {
  id: ColdReadingTechnique;
  label: string;
  description: string;
}

// 改寫自 Forer（1948）與冷讀術文獻中常見的通用型人格描述手法，全部另行以中文撰寫。
export const TECHNIQUES: TechniqueInfo[] = [
  { id: 'rainbow-ruse', label: '彩虹式話術', description: '同一句話講出一體兩面（例如「有時外向，有時需要獨處」），不管你是哪一種，聽起來都對。' },
  { id: 'fine-flattery', label: '精準奉承', description: '用大多數人都樂於相信、關於自己的正面描述包裝，讓人不自覺想點頭認同。' },
  { id: 'barnum-statement', label: '巴納姆句', description: '模糊到幾乎人人都適用，卻因為講的對象是「你」，就顯得特別準確。' },
  { id: 'vague-universal', label: '模糊泛用', description: '描述的情境太普遍，幾乎每個人都能對號入座，套在誰身上都成立。' },
  { id: 'safe-question', label: '安全提問', description: '把幾乎人人都會遇到的處境（例如「正在思考人生方向」），講得像是專屬洞察。' },
  { id: 'high-probability-guess', label: '高機率猜測', description: '根據統計上非常常見的人生經驗做出「猜測」，本來命中率就不低。' },
  { id: 'sub-typing', label: '次分類話術', description: '把籠統的說法加上一個限定條件，讓它聽起來更精準、更像是專門講給你聽的。' },
];

export const BARNUM_STATEMENTS: BarnumStatement[] = [
  { id: 'b01', text: '你有時候很外向、擅長交際，但有時候又需要獨處來恢復精神。', technique: 'rainbow-ruse' },
  { id: 'b02', text: '你擁有相當大的潛力，只是還沒有完全被自己或別人發掘。', technique: 'barnum-statement' },
  { id: 'b03', text: '你表面上看起來很有自信，內心卻常常懷疑自己是否做得夠好。', technique: 'rainbow-ruse' },
  { id: 'b04', text: '你重視誠實與原則，但偶爾也會說一些善意的謊言來維持和諧。', technique: 'rainbow-ruse' },
  { id: 'b05', text: '你其實比大多數人以為的更有深度、更細膩。', technique: 'fine-flattery' },
  { id: 'b06', text: '有些時候，你會希望別人多欣賞你的努力，而不是只看結果。', technique: 'vague-universal' },
  { id: 'b07', text: '你渴望被喜愛與尊敬，但也懂得在必要時保護自己的界線。', technique: 'rainbow-ruse' },
  { id: 'b08', text: '你的人生中曾經有過一個重要的決定，至今仍讓你反覆思考。', technique: 'safe-question' },
  { id: 'b09', text: '在某些關係裡，你覺得自己付出得比對方多。', technique: 'high-probability-guess' },
  { id: 'b10', text: '你有能力適應各種不同的情境，但也偏好某種程度的規律與安全感。', technique: 'rainbow-ruse' },
  { id: 'b11', text: '最近你正在思考關於方向或選擇的問題，還沒有找到確定的答案。', technique: 'safe-question' },
  { id: 'b12', text: '你不會輕易把心事告訴每一個人，只有少數人真正了解你。', technique: 'barnum-statement' },
  { id: 'b13', text: '你有時候會後悔一些沒有說出口的話，或沒有做的決定。', technique: 'vague-universal' },
  { id: 'b14', text: '表面上你看起來很平靜，但其實內心偶爾會有些波動。', technique: 'rainbow-ruse' },
  { id: 'b15', text: '你希望自己能更放鬆一點，卻常常忍不住把責任攬在身上。', technique: 'fine-flattery' },
  { id: 'b16', text: '你曾經因為信任錯的人而受過傷，這讓你變得更謹慎。', technique: 'high-probability-guess' },
  { id: 'b17', text: '你其實擁有一些連自己都還沒完全發現的才能。', technique: 'barnum-statement' },
  { id: 'b18', text: '你重視自由，但也珍惜跟親近的人之間穩定的連結。', technique: 'rainbow-ruse' },
  { id: 'b19', text: '有時候你會覺得，其他人並不真正理解你經歷過的事。', technique: 'vague-universal' },
  { id: 'b20', text: '你對某些事情要求很高，尤其是對自己。', technique: 'fine-flattery' },
  { id: 'b21', text: '你希望未來的生活比現在更充實，但還在摸索具體的方法。', technique: 'safe-question' },
  { id: 'b22', text: '你有能力在壓力下保持冷靜，即使內心其實不太平靜。', technique: 'rainbow-ruse' },
  { id: 'b23', text: '你偶爾會懷念過去某段簡單、沒有太多煩惱的時光。', technique: 'vague-universal' },
  { id: 'b24', text: '你比自己以為的更堅強，也撐過了一些不容易的階段。', technique: 'fine-flattery' },
  { id: 'b25', text: '你希望身邊的人能主動一點，而不用每次都由你來開口。', technique: 'vague-universal' },
  { id: 'b26', text: '你不喜歡被貼標籤，覺得自己比任何單一形容詞都複雜。', technique: 'barnum-statement' },
  { id: 'b27', text: '你曾經在工作或學業上，有過一次讓自己印象深刻的成功經驗。', technique: 'high-probability-guess' },
  { id: 'b28', text: '你對未知的事物同時感到好奇，又有一點小心翼翼。', technique: 'rainbow-ruse' },
  { id: 'b29', text: '你希望自己做的決定能被認可，即使嘴上說不在乎別人的看法。', technique: 'fine-flattery' },
  { id: 'b30', text: '這陣子，你身邊至少有一段關係，讓你覺得需要花點心力維護。', technique: 'high-probability-guess' },
  { id: 'b31', text: '你偶爾會想，如果當初選了不同的路，現在會是什麼樣子。', technique: 'vague-universal' },
  { id: 'b32', text: '你很會照顧別人的情緒，卻不一定擅長照顧自己的情緒。', technique: 'sub-typing' },
];
