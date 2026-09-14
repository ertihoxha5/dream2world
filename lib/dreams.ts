export type Dream = {
  id: string;
  title: string;
  summary: string;
  text: string;
  scene: number;
  mood: string;
  date: string;
  symbols: string[];
  locations: { name: string; description: string }[];
  characters: {
    name: string;
    role: string;
    description: string;
    connection: string;
    locations: string[];
  }[];
  storyFragments: string[];
  dominantColors: string[];
  soundscape: string;
  interpretation: string;
  engine?: string;
  imageUrl?: string;
};
export const locations = [
  {
    name: 'Moon Plaza',
    description:
      'A pale moon hangs close enough to touch. The plaza remembers every footstep, even the ones you haven’t taken yet.',
  },
  {
    name: 'The Empty Train',
    description:
      'An empty carriage arrives without a sound. Through each window, a different memory drifts past.',
  },
  {
    name: 'Mirror Forest',
    description:
      'Every leaf reflects a sky you once knew. A path appears only when you stop looking for it.',
  },
  {
    name: 'House #17',
    description:
      'The door is familiar. Inside, a room holds the feeling of a place you thought you had forgotten.',
  },
  {
    name: 'The Endless Bridge',
    description:
      'The bridge disappears into the horizon. Somewhere beyond the mist, your dream continues.',
  },
];
const base = {
  locations,
  characters: [
    {
      name: 'The Keeper of Echoes',
      role: 'A quiet guide',
      description:
        'They seem to recognize you, though you cannot remember meeting.',
      connection: 'Their connection to you is an unfinished memory.',
      locations: ['Moon Plaza', 'Mirror Forest'],
    },
  ],
  storyFragments: [
    'You follow a faint sound through the plaza. The world feels strangely familiar.',
    'A door opens in the distance, and for a moment, you remember why you came.',
  ],
  dominantColors: ['#152443', '#7970ba', '#9cbee3'],
  soundscape:
    'Slow-moving mist, distant echoes, and a sky that never quite becomes night.',
  interpretation:
    'One possible interpretation is a desire to explore the unfamiliar while holding on to something you know. These images could symbolize memories or feelings that stayed with you.',
};
export const worlds: Dream[] = [
  {
    id: 'sky',
    title: 'The Sky Islands',
    summary: 'A peaceful world above the clouds.',
    text: 'A city floating above clouds beneath a giant moon.',
    scene: 0,
    mood: 'Wonder',
    symbols: ['Moon', 'Light'],
  },
  {
    id: 'abyss',
    title: 'Abyssal Home',
    summary: 'Life in the deep blue.',
    text: 'An underwater civilization with glowing forests and a stranger.',
    scene: 1,
    mood: 'Serenity',
    symbols: ['Water', 'Light'],
  },
  {
    id: 'forest',
    title: 'The Eternal Forest',
    summary: 'Where time moves differently.',
    text: 'A forest with a glowing tree, mirrors and a moon.',
    scene: 2,
    mood: 'Enchantment',
    symbols: ['Forest', 'Moon'],
  },
  {
    id: 'horizon',
    title: 'The Last Horizon',
    summary: 'A quiet planet, but not an empty one.',
    text: 'A silent desert planet with colorful skies and an endless bridge.',
    scene: 3,
    mood: 'Solitude',
    symbols: ['Light', 'Bridge'],
  },
].map((w) => ({ ...base, ...w, date: '2026-09-14', engine: 'preview' }));
export function previewDream(text: string): Dream {
  const scene = /underwater|ocean|sea|water/i.test(text)
    ? 1
    : /forest|tree|book/i.test(text)
      ? 2
      : /planet|desert|silent|fire/i.test(text)
        ? 3
        : 0;
  const symbols = [
    'Moon',
    'Water',
    'Doors',
    'Train',
    'Fire',
    'Falling',
    'Forest',
    'Light',
    'Bridge',
    'Music',
    'Books',
  ].filter((s) => new RegExp(s.replace(/s$/, ''), 'i').test(text));
  return {
    ...worlds[scene],
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    text,
    title: /book/i.test(text)
      ? 'The Library Without an End'
      : /music/i.test(text)
        ? 'The City That Sang'
        : [
            'The City Above the Sea',
            'Where the Ocean Remembers',
            'The Forest Between Memories',
            'Beyond the Last Horizon',
          ][scene],
    summary: `Somewhere between memory and imagination, ${['a floating city waits above an endless sea', 'a luminous world stirs beneath the surface', 'an ancient forest holds a forgotten story', 'a distant world waits beneath unfamiliar skies'][scene]}.`,
    symbols: symbols.length ? symbols : worlds[scene].symbols,
    characters: [
      {
        ...base.characters[0],
        name: /stranger|someone|person|woman|man/i.test(text)
          ? 'The Stranger'
          : 'The Keeper of Echoes',
      },
    ],
    storyFragments: [
      `The dream begins with a memory: “${text}”`,
      base.storyFragments[0],
      base.storyFragments[1],
    ],
  };
}
