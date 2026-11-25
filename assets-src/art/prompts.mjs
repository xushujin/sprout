// Prompts for the hand-painted illustration set.
//
// Two art directions, one per theme. Word art and the three subject still lifes
// stay in the neutral STYLE so every child sees the same teaching picture; the
// boy theme dresses its hero and tip card as round toy mecha (MECHA_STYLE), the
// girl theme as chibi cartoon (CUTE_STYLE). The generator appends the style to
// each subject, so a new word only needs one short description.
//
// `aspect` is the only composition knob the provider exposes: characters get a
// tall 2:3 portrait, still life and word art stay square so the quiz tile can
// crop them safely.

export const STYLE =
  "A soft gouache and coloured-pencil children's picture-book illustration, " +
  'hand-painted on warm textured paper, gentle rounded shapes, warm natural light, ' +
  'rich but soft colours, a single clear subject, subtle paper grain, hand-drawn ' +
  'only (not 3D, not CGI, not a photograph), no text, no letters, no numbers, ' +
  'no border, isolated on a transparent background.';

const SCENE_STYLE =
  'A soft gouache and coloured-pencil children’s picture-book illustration, ' +
  'hand-painted on warm textured paper, gentle rounded shapes, warm natural light, ' +
  'rich but soft colours, storybook detail, subtle paper grain, hand-drawn only ' +
  '(not 3D, not CGI, not a photograph), no text, no letters, no numbers, no border, ' +
  'isolated on a transparent background.';

// Boy theme: round, toylike mecha. Kept chunky and warm so it reads as a toy
// figure rather than a war machine.
const MECHA_STYLE =
  'A friendly 2D picture-book illustration of toy-like mecha design, painted in ' +
  'gouache with coloured-pencil line work on warm textured paper: chunky rounded ' +
  'armour plates, oversized helmet, visible ball joints, sturdy boots, soft ' +
  'metallic sheen, warm studio light, cool steel blue, graphite and cream with a ' +
  'single honey-orange accent, hand-drawn only (not 3D, not CGI, not a photograph), ' +
  'no text, no letters, no numbers, no logo, no border, isolated on a transparent ' +
  'background.';

// Girl theme: chibi cartoon, thick outlines and candy pastels.
const CUTE_STYLE =
  'A cute chibi cartoon illustration for young children: big sparkling eyes, round ' +
  'cheeks with soft blush, chubby simplified shapes, thick smooth outlines, flat ' +
  'candy colours with a light gouache texture, tiny sparkles, warm pastel rose, ' +
  'peach, mint and butter yellow, no text, no letters, no numbers, no border, ' +
  'isolated on a transparent background.';

export const SCENES = {
  'hero-boy': {
    canvas: [720, 1080],
    aspect: '2:3',
    style: MECHA_STYLE,
    prompt:
      'A cheerful 7-year-old boy pilot standing beside his knee-high round toy mecha companion. The boy has tousled brown hair, a mustard tee, olive cargo shorts and chunky sneakers, one light mecha arm guard and a small flight pack. The mecha has an oversized rounded helmet with a warm amber visor, stubby arms, chunky feet and a short antenna. Both stand full body in three-quarter view facing the viewer with friendly confident smiles. Cool steel blue, graphite and cream with honey-orange accents.',
  },
  'hero-girl': {
    canvas: [720, 1080],
    aspect: '2:3',
    style: CUTE_STYLE,
    prompt:
      'A cheerful chibi girl gardener with two braids, a blush-pink pinafore dress and a cream blouse, holding a small mint watering can and watering three fat tulips. Beside her a round bluebird, a butterfly and a short wooden fence. Big sparkling eyes, round cheeks, chubby simplified shapes, full body, three-quarter view, happy smile. Rose, peach, lavender and mint pastel palette.',
  },
  'subject-english': {
    canvas: [512, 512],
    aspect: '1:1',
    style: STYLE,
    prompt:
      'One open storybook seen at a slight angle, a tiny green sprout growing from the centre pages, one small bluebird perched on the top corner. Minimal still life with generous empty space, cream pages and sage green cover, no other objects.',
  },
  'subject-chinese': {
    canvas: [512, 512],
    aspect: '1:1',
    style: STYLE,
    prompt:
      'One traditional Chinese ink brush resting diagonally on an open blank scroll, one small plum blossom sprig beside it. Minimal still life with generous empty space, rice paper cream, ink black and plum pink, no writing and no other objects.',
  },
  'subject-math': {
    canvas: [512, 512],
    aspect: '1:1',
    style: STYLE,
    prompt:
      'One small wooden counting frame with three rows of colourful beads, seen at a slight angle. Minimal still life with generous empty space, warm wood and coral, sky blue and butter yellow beads, no other objects.',
  },
  'note-boy': {
    canvas: [256, 256],
    aspect: '1:1',
    style: MECHA_STYLE,
    prompt:
      'A small cluster of mecha treasures: one chunky toy robot figurine, a hex bolt, a folded blueprint card, a coiled cable and a tiny wrench. Still life, compact composition, steel blue, graphite and honey orange, rounded toy-like shapes.',
  },
  'note-girl': {
    canvas: [256, 256],
    aspect: '1:1',
    style: CUTE_STYLE,
    prompt:
      'A small cluster of cute treasures: a mint watering can, three chubby tulips, a round smiling butterfly and a smooth pebble. Still life, compact composition, rose, mint and butter yellow, chubby rounded shapes.',
  },
  celebrate: {
    canvas: [256, 256],
    aspect: '1:1',
    style: STYLE,
    prompt:
      'A joyful round sun with soft golden rays, a tiny green sprout growing in front of it, confetti, small stars and two leaves, arranged as a circular celebration medallion. Warm gold, leaf green and coral palette.',
  },
};

// Grade 1 and grade 2 are fully illustrated: every word a child meets in the
// first two years has a picture, so a picture question never mixes art styles.
export const WORDS = {
  // ---- Grade 1 · fruit -------------------------------------------------
  apple: 'a single ripe red apple with one green leaf and a short stem',
  banana: 'a single ripe yellow banana with a small brown tip',
  orange: 'a single whole orange fruit with a green leaf',
  grape: 'a small bunch of purple grapes with one green leaf',
  pear: 'a single ripe green pear with a short stem',

  // ---- Grade 1 · animals ----------------------------------------------
  cat: 'a friendly orange tabby cat sitting with its tail curled',
  dog: 'a happy golden puppy sitting with its tongue out',
  rabbit: 'a soft white rabbit with long ears sitting',
  bird: 'a small blue bird perched on a slender twig',
  fish: 'a single orange fish swimming with a bubble',
  panda: 'a chubby giant panda sitting and holding a bamboo shoot',
  monkey: 'a cheerful brown monkey hanging from a branch by one arm',
  tiger: 'a young tiger sitting with black stripes and amber eyes',
  lion: 'a friendly lion with a full golden mane sitting',
  elephant: 'a gentle grey elephant with big ears and a raised trunk',
  duck: 'a fluffy yellow duckling standing',
  horse: 'a friendly brown horse standing with a flowing mane',
  sheep: 'a round fluffy white sheep with a small pink face',
  cow: 'a black-and-white dairy cow standing',
  pig: 'a round pink piglet with a curly tail',
  bear: 'a warm brown bear cub sitting',

  // ---- Grade 1 · nature ------------------------------------------------
  sun: 'a bright round sun with soft golden rays and a warm glow',
  moon: 'a golden crescent moon with three tiny stars',
  star: 'a single golden five-pointed star with a soft shine',
  tree: 'a round leafy green tree with a sturdy brown trunk',
  flower: 'a single pink daisy with a yellow centre and two leaves',

  // ---- Grade 1 · school ------------------------------------------------
  book: 'an open children’s storybook with colourful pictures on the pages',
  pencil: 'a single yellow pencil with a pink eraser, slightly angled',
  bag: 'a small canvas school backpack in teal and mustard',
  ruler: 'a wooden ruler with clear tick marks but no numbers',
  clock: 'a round alarm clock with two bells and clear hands',

  // ---- Grade 1 · colours ----------------------------------------------
  red: 'a bright red paint splash with a small paintbrush resting beside it',
  blue: 'a bright blue paint splash with a small paintbrush resting beside it',
  yellow: 'a sunny yellow paint splash with a small paintbrush resting beside it',
  green: 'a fresh green paint splash with a small paintbrush resting beside it',
  black: 'a deep black paint splash on a pale grey paper with a paintbrush',
  white: 'a soft white paint splash on a pale grey paper with a paintbrush',
  pink: 'a candy pink paint splash with a small paintbrush resting beside it',
  brown: 'a warm brown paint splash with a small paintbrush resting beside it',
  purple: 'a rich purple paint splash with a small paintbrush resting beside it',

  // ---- Grade 1 · numbers ----------------------------------------------
  one: 'one red apple on a small wooden plate',
  two: 'two fluffy yellow ducklings standing side by side',
  three: 'three golden stars floating in a small cluster',
  four: 'four colourful wooden building blocks stacked in a small tower',
  five: 'five round balloons in different colours tied with strings',
  six: 'six white daisies arranged in a small bunch',
  seven: 'seven tiny orange fish swimming in a loose group',
  eight: 'eight butterflies with patterned wings fluttering together',
  nine: 'nine round wooden beads on a short string',
  ten: 'ten small wooden blocks arranged in two neat rows',

  // ---- Grade 1 · family ------------------------------------------------
  mother: 'a kind mother with shoulder-length brown hair and a soft smile',
  father: 'a kind father with short dark hair and round glasses',
  sister: 'a cheerful girl with a high ponytail and a yellow hair tie',
  brother: 'a cheerful boy wearing a blue baseball cap',
  grandma: 'a gentle grandmother with silver hair, glasses and a knitted shawl',
  grandpa: 'a gentle grandfather with silver hair, glasses and a cardigan',
  family: 'a family of four holding hands: mother, father, a girl and a boy',
  baby: 'a smiling baby sitting up with a small wooden rattle',

  // ---- Grade 1 · food --------------------------------------------------
  water: 'a clear glass of water with a gentle ripple and a mint leaf',
  cake: 'a slice of layer cake with cream and a strawberry on top',
  bread: 'a warm golden loaf of bread with a sliced end',
  milk: 'a glass bottle of milk with a small cup beside it',

  // ---- Grade 1 · clothes ----------------------------------------------
  hat: 'a woven straw sun hat with a wide brim and a ribbon',
  shirt: 'a folded blue cotton shirt with a collar and buttons',
  shoe: 'a single red sneaker with white laces and a white sole',

  // ---- Grade 1 · describing words --------------------------------------
  big: 'a huge blue whale swimming beside a tiny yellow rowboat with one child, both in the same frame, clear size contrast',
  small: 'a tiny red ladybird resting on a large green leaf',
  tall: 'a tall giraffe stretching its neck to reach acacia leaves',
  short: 'a short round penguin standing next to a tall grass stalk',
  good: 'a smiling child giving a thumbs up with a small gold star nearby',
  bad: 'a broken wooden toy boat with a cracked hull, a torn sail and a loose rudder, lying on its side',
  happy: 'a laughing child with arms lifted and eyes closed in joy',
  sad: 'a child with a single tear, holding a dropped ice cream cone',

  // ---- Grade 1 · actions ----------------------------------------------
  run: 'a child running happily with a small backpack bouncing',
  jump: 'a child jumping over a puddle with arms spread wide',
  sing: 'a child singing into a microphone with floating music notes',
  dance: 'a child twirling in a flowing dress with arms raised',
  draw: 'a child painting at a small wooden easel with a brush',
  read: 'a child sitting cross-legged reading a picture book',
  write: 'a child writing in a notebook with a pencil, tongue out in concentration',

  // ---- Grade 1 · toys --------------------------------------------------
  ball: 'a classic black-and-white football with soft grass tufts',
  doll: 'a handmade rag doll with yarn hair and a patchwork dress',
  toy: 'a small wooden toy train with colourful blocks',
  kite: 'a red diamond kite with a long ribbon tail flying in the sky',

  // ---- Grade 1 · greetings ---------------------------------------------
  hello: 'two cheerful children waving at each other',
  hi: 'one cheerful child waving with a bright smile',
  bye: 'a child waving goodbye at an open door with a small suitcase',
  thanks: 'a child giving a wrapped gift to another child with both hands',
  please: 'a child with hands clasped together and hopeful eyes',
  sorry: 'a child with hands behind their back and an apologetic expression',

  // ---- Grade 1 · pronouns ----------------------------------------------
  i: 'a child pointing at their own chest with a bright smile',
  you: 'a child pointing gently toward the viewer with a friendly smile',
  he: 'a boy standing with hands in his pockets, smiling',
  she: 'a girl standing with her hands clasped, smiling',
  it: 'a cute little round robot with antenna and glowing eyes',
  we: 'two children holding hands and smiling',
  they: 'three children standing together and waving',

  // ---- Grade 1 · pointing words ----------------------------------------
  this: 'a child holding a red apple close to their chest',
  that: 'a child pointing at a kite far away on the horizon',
  here: 'a child standing on a small round marker with a flag beside them',

  // ---- Grade 2 · body --------------------------------------------------
  face: 'a cheerful child’s face with rosy cheeks and a wide smile',
  hair: 'a wooden comb resting beside a lock of wavy brown hair',
  eye: 'one big friendly child’s eye, a simple rounded almond shape with a bright brown iris and long lashes, drawn as a flat picture-book spot illustration, no anatomical detail',
  ear: 'a child’s head seen from the side, cropped close from temple to jaw so the ear fills most of the frame, short brown hair tucked behind the ear, warm skin, drawn as a flat picture-book spot illustration, no anatomical detail',
  nose: 'a close-up of a child’s nose with a sprinkle of freckles',
  mouth: 'a close-up of a child’s smiling mouth showing small teeth',
  hand: 'a child’s open hand with five fingers, palm up',
  foot: 'one child’s bare foot seen from the side at a slight angle, five rounded toes, warm skin tone, nothing else in the frame, drawn as a flat picture-book spot illustration, no anatomical detail',
  head: 'a child’s head and shoulders with tousled hair',
  arm: 'a child’s arm raised and flexing with a playful smile',
  leg: 'a child’s leg and red sneaker mid-step',
  body: 'a full-body child standing and waving, simple cream outfit',

  // ---- Grade 2 · school ------------------------------------------------
  pen: 'a single blue ballpoint pen with a silver clip',
  eraser: 'a rectangular pink eraser with one rounded corner',
  desk: 'a tidy wooden school desk with a pencil and a notebook',
  chair: 'a small wooden school chair with a curved back',
  door: 'a warm wooden door with a round brass handle',
  window: 'a white-framed window with blue curtains and a sunny view',
  school: 'a friendly red-brick school building with a bell tower and a tree',
  classroom: 'a bright classroom with desks, a green board and a globe',
  teacher: 'a kind teacher with a pointer standing beside a blank board',
  friend: 'two children with arms around each other, laughing',
  student: 'a child with a backpack holding a book, ready for school',
  classmate: 'two children sharing a desk and smiling at each other',
  schoolbag: 'a sturdy blue schoolbag with a front pocket and straps',
  crayon: 'three chunky crayons in red, blue and yellow, slightly fanned',
  map: 'a folded paper map with green land, blue water and a red pin',
  picture: 'a framed child’s drawing of a house, sun and flowers',

  // ---- Grade 2 · clothes -----------------------------------------------
  cap: 'a blue baseball cap with a small star patch',
  coat: 'a warm camel-coloured winter coat with wooden buttons',
  dress: 'a floaty pink dress with a white collar on a hanger',
  skirt: 'a pleated mint-green skirt on a hanger',
  shorts: 'a pair of denim shorts folded neatly',
  trousers: 'a pair of navy trousers folded neatly',
  sock: 'a pair of striped wool socks, one folded over the other',
  sweater: 'a cosy cream knitted sweater with a cable pattern',
  umbrella: 'an open red umbrella with a curved wooden handle',

  // ---- Grade 2 · home --------------------------------------------------
  house: 'a cosy cottage with a red roof, chimney and flower boxes',
  home: 'a warm living room with a sofa, lamp, plant and family photos',
  bed: 'a tidy child’s bed with a patchwork quilt and a teddy bear',
  room: 'a tidy child’s room with a window, toy shelf and a rug',
  bedroom: 'a cosy bedroom with a bed, bedside lamp and starry curtains',
  bathroom: 'a bright bathroom with a bathtub, mirror and folded towels',
  kitchen: 'a warm kitchen with a stove, pots, a bowl of fruit and a window',
  table: 'a round wooden dining table with a small vase of flowers',
  sofa: 'a comfortable sage-green sofa with two cushions',
  light: 'a warm table lamp with a linen shade glowing softly',

  // ---- Grade 2 · food --------------------------------------------------
  rice: 'a bowl of steaming white rice with a wooden spoon',
  noodles: 'a bowl of noodle soup with a soft egg and green onion',
  tomato: 'a single ripe red tomato with a green calyx',
  potato: 'two brown potatoes, one whole and one cut open',
  carrot: 'a single orange carrot with a leafy green top',
  watermelon: 'a slice of watermelon with black seeds and green rind',
  strawberry: 'a single red strawberry with green leaves and seeds',
  breakfast: 'a breakfast tray with toast, a boiled egg and a glass of milk',
  lunch: 'an open lunchbox with a sandwich, apple slices and a carrot stick',
  dinner: 'a dinner plate with rice, vegetables and a small piece of fish',

  // ---- Grade 2 · animals -----------------------------------------------
  bee: 'a fuzzy bumblebee hovering beside a yellow flower',
  ant: 'a small black ant carrying a crumb along a leaf',
  frog: 'a green frog sitting on a lily pad',
  snake: 'a gentle green snake curled in a soft spiral',
  mouse: 'a tiny grey mouse with round ears and a long tail',
  butterfly: 'a butterfly with orange and blue patterned wings',
  penguin: 'a emperor penguin chick standing on ice',
  goat: 'a white goat with small horns and a beard',
  deer: 'a gentle spotted deer standing among ferns',
  wolf: 'a grey wolf sitting and looking calmly ahead',

  // ---- Grade 2 · weather and seasons -----------------------------------
  sunny: 'a bright sun in a clear blue sky with two soft clouds',
  cloudy: 'three fluffy grey-white clouds filling a soft sky',
  windy: 'a tree bending in the wind with leaves swirling',
  rainy: 'a soft rain cloud with blue raindrops and a small puddle',
  spring: 'a blossoming cherry tree with petals falling and a butterfly',
  summer: 'a sunny beach with a sandcastle, shells and a striped umbrella',
  autumn: 'a pile of orange and red autumn leaves with two pumpkins',
  winter: 'a cheerful snowman with a scarf and falling snowflakes',

  // ---- Grade 2 · describing words --------------------------------------
  warm: 'two hands in knitted mittens holding a steaming mug of cocoa',
  cool: 'a tall glass of iced lemonade with ice cubes and mint',
  old: 'a kind elderly person with silver hair, glasses and a walking stick',
  young: 'a young child with a small sprout in a pot',
  new: 'a pair of shiny new red shoes with tiny sparkles',
  clean: 'a crisp white shirt on a hanger with sparkles around it',
  dirty: 'a pair of muddy rain boots with splashes of mud',
  fat: 'a plump round orange pumpkin with a curly stem',
  thin: 'a slender green bean pod with three beans visible',
  strong: 'a child flexing a strong arm with a playful grin',
  quiet: 'a child holding one finger to their lips with calm eyes',
  fast: 'a running cheetah with soft speed lines behind it',

  // ---- Grade 2 · actions -----------------------------------------------
  walk: 'a child walking along a path with a small backpack',
  ride: 'a child riding a red bicycle with a basket',
  swim: 'a child swimming freestyle with goggles and splashes',
  fly: 'a small bird flying with wings spread over soft clouds',
  sleep: 'a child sleeping peacefully under a quilt with a teddy bear',
  listen: 'a child cupping a hand to their ear and listening',
  speak: 'a child speaking with an open hand gesture and a speech bubble',
  sit: 'a child sitting cross-legged on a cushion',
  stand: 'a child standing tall with hands at their sides',
  open: 'an open wooden treasure box with a soft glow inside',

  // ---- Grade 2 · short answers -----------------------------------------
  yes: 'a child nodding with a big smile and a thumbs up',
  no: 'a child shaking their head with palms raised gently',
  ok: 'a hand making an OK sign with a small sparkle',
};
