/* Hangman word list: common English words, 4 to 10 letters, grouped by category.
   Written for Vela Arcade. Spellings that differ between British and American
   English are left out. window.HANGMAN_WORDS is [{ word, category }] at runtime. */
(function () {
  var CATS = {
    'Animals':
      'badger beaver bison camel cheetah chicken cobra coyote donkey dolphin eagle falcon ferret flamingo frog ' +
      'gazelle gecko giraffe goat goose gorilla hamster hedgehog heron hippo horse hyena iguana jaguar kangaroo ' +
      'koala leopard lion lizard llama lobster monkey moose mouse otter panda panther parrot peacock pelican ' +
      'penguin pigeon puffin rabbit raccoon raven rhino salmon seal shark sheep sloth snail snake spider squid ' +
      'squirrel swan tiger toad tortoise turkey turtle walrus weasel whale wolf zebra octopus jellyfish beetle ' +
      'butterfly dragonfly hornet ladybug mosquito moth wasp termite crab shrimp oyster clam starfish sardine ' +
      'trout tuna mackerel buffalo antelope armadillo alligator crocodile chipmunk mole vulture sparrow robin ' +
      'finch crow duck hawk lamb calf pony kitten puppy bull deer bear mule hare newt wombat lemur meerkat ' +
      'ostrich toucan cougar lynx bobcat reindeer porcupine mongoose skunk stingray seahorse goldfish tadpole ' +
      'woodpecker owlet pheasant cardinal bluebird seagull swallow',
    'Food and drink':
      'apple banana cherry grape lemon mango melon orange peach pear plum kiwi lime papaya apricot coconut ' +
      'avocado pineapple strawberry blueberry raspberry watermelon tomato potato carrot onion garlic pepper ' +
      'celery spinach lettuce cabbage broccoli cucumber pumpkin radish turnip beans corn mushroom olive bread ' +
      'butter cheese cream milk honey jelly sugar salt flour rice pasta noodles pizza burger sandwich ' +
      'salad soup stew pancake waffle muffin cookie biscuit cupcake brownie pudding custard cake toast ' +
      'cereal oatmeal popcorn pretzel cracker bacon sausage steak coffee juice lemonade soda cocoa smoothie ' +
      'milkshake vanilla caramel chocolate cinnamon ginger mustard ketchup vinegar sauce gravy walnut peanut ' +
      'almond cashew pickle burrito taco dumpling sushi curry lasagna spaghetti meatball broth bagel scone ' +
      'toffee candy lollipop sorbet granola porridge raisin hazelnut pistachio parsley basil oregano thyme mint ' +
      'herbs nectarine grapefruit tangerine blackberry cranberry zucchini eggplant asparagus artichoke beetroot ' +
      'lentils chickpeas tortilla nachos crepe fudge syrup',
    'In the house':
      'table chair sofa couch lamp carpet curtain pillow blanket mattress shelf drawer cupboard closet mirror ' +
      'window door stairs ceiling floor wall roof chimney kitchen bedroom bathroom garage attic cellar basement ' +
      'hallway balcony porch fence gate mailbox doorbell kettle teapot toaster oven fridge freezer stove sink ' +
      'faucet bucket broom vacuum sponge towel soap toothbrush shampoo bathtub shower candle clock radio ' +
      'television computer laptop phone camera picture frame vase basket cushion bookcase wardrobe dresser ' +
      'plate bowl spoon fork knife napkin saucer glass cradle doormat fireplace furnace heater hanger laundry ' +
      'dishwasher microwave blender cutlery tablecloth staircase pantry doorknob lightbulb nightstand ' +
      'armchair stool teaspoon ladle colander',
    'Nature and weather':
      'river ocean lake pond stream forest jungle desert valley canyon cliff mountain hill island beach shore ' +
      'coast cave volcano glacier iceberg waterfall meadow prairie swamp marsh rock stone pebble sand soil clay ' +
      'boulder rainbow thunder lightning storm cloud rain snow hail sleet frost wind breeze tornado hurricane ' +
      'blizzard drizzle mist sunshine sunset sunrise moonlight weather season spring summer autumn winter dawn ' +
      'dusk horizon puddle icicle snowflake wave tide lagoon reef dune plateau delta creek brook oasis tundra ' +
      'savanna rainforest wildfire avalanche earthquake flood drought rainstorm snowstorm ' +
      'waterfront seashell driftwood hillside riverbank',
    'Plants':
      'flower tree leaf root branch twig seed acorn petal stem thorn rose tulip daisy lily orchid lotus ' +
      'sunflower daffodil violet poppy lavender jasmine cactus fern moss grass clover bamboo maple pine willow ' +
      'birch cedar palm weed vine bush shrub hedge blossom orchard pollen seedling sapling dandelion buttercup ' +
      'magnolia hibiscus marigold bluebell heather thistle nettle cypress redwood beech spruce chestnut holly ' +
      'aspen sycamore evergreen bonsai peony carnation geranium snowdrop primrose crocus begonia ' +
      'seaweed',
    'Jobs':
      'doctor nurse teacher farmer baker butcher chef waiter pilot sailor soldier driver plumber painter ' +
      'writer author artist actor singer dancer dentist lawyer judge officer sheriff mechanic engineer ' +
      'scientist builder carpenter gardener florist banker cashier clerk manager secretary reporter editor ' +
      'designer architect surgeon pharmacist librarian professor tutor coach referee athlete captain guard ' +
      'janitor cleaner tailor barber potter fisherman rancher miner astronaut detective musician composer poet ' +
      'magician clown nanny courier porter butler mayor senator president king queen prince princess knight ' +
      'lifeguard postman programmer accountant translator therapist paramedic ' +
      'zookeeper beekeeper shepherd blacksmith locksmith',
    'Sports and games':
      'soccer tennis golf hockey rugby cricket baseball football basketball volleyball boxing karate judo ' +
      'wrestling archery fencing cycling rowing sailing skiing skating surfing swimming diving running jogging ' +
      'marathon sprint hurdles javelin gymnast bowling billiards darts chess checkers puzzle dominoes bingo ' +
      'poker dice marbles kite trophy medal goal score racket helmet whistle stadium champion tournament team ' +
      'player league skateboard snowboard badminton lacrosse softball handball pinball hopscotch jigsaw ' +
      'crossword riddle kickball goalkeeper scoreboard teammate rematch overtime penalty',
    'The body':
      'head face hair nose mouth tooth teeth tongue lips cheek chin neck shoulder elbow wrist hand finger thumb ' +
      'knuckle chest stomach waist knee ankle foot heel heart lungs brain bone skull spine muscle skin blood ' +
      'eyebrow eyelash forehead throat kidney liver fingernail skeleton belly eyelid freckle dimple toenail ' +
      'heartbeat backbone',
    'Clothing':
      'shirt jacket coat sweater hoodie dress skirt pants jeans shorts socks shoes boots sandals sneakers ' +
      'slippers scarf gloves mittens beanie belt necktie collar sleeve pocket button zipper apron uniform ' +
      'costume pajamas robe vest blouse tuxedo overalls raincoat umbrella backpack handbag wallet purse ' +
      'necklace bracelet earring ring watch glasses sunglasses crown cardigan poncho leggings swimsuit tights ' +
      'bandana earmuffs shoelace bootlace',
    'Music':
      'piano guitar violin cello flute drum trumpet trombone tuba harp banjo ukulele clarinet saxophone ' +
      'harmonica accordion xylophone tambourine cymbal organ bass melody rhythm harmony chord note song tune ' +
      'lyrics chorus verse concert orchestra band choir opera ballad anthem lullaby tempo beat album record ' +
      'speaker microphone headphones bugle oboe bagpipes keyboard symphony conductor guitarist drummer pianist ' +
      'jazz blues violinist soloist duet quartet encore playlist',
    'Getting around':
      'truck train plane boat ship bicycle motorcycle scooter taxi subway tram ferry yacht canoe kayak raft ' +
      'submarine rocket helicopter airplane glider balloon tractor wagon cart sled sleigh carriage ambulance ' +
      'trailer bridge tunnel highway road street avenue station airport passport luggage suitcase ticket ' +
      'journey voyage compass engine wheel anchor sail paddle traffic parking railway runway motorway ' +
      'crossroads roundabout sidewalk minibus limousine sailboat speedboat',
    'Places':
      'school library museum hospital church temple castle palace tower bank bakery market office factory ' +
      'farm barn stable cinema restaurant cafe hotel prison jail park village city town country capital ' +
      'lighthouse windmill cottage cabin mansion apartment igloo tent pyramid statue fountain monument gallery ' +
      'studio arena pharmacy bookstore mall shop store warehouse campsite playground courtyard cathedral ' +
      'aquarium bakehouse firehouse greenhouse treehouse schoolyard downtown suburb skyscraper',
    'Science and space':
      'planet star moon galaxy comet meteor asteroid orbit gravity universe telescope satellite eclipse nebula ' +
      'atom molecule electron proton neutron magnet energy battery circuit laser robot oxygen hydrogen carbon ' +
      'copper silver gold metal crystal fossil dinosaur microscope experiment laboratory formula chemical ' +
      'element liquid solid plasma friction velocity spaceship physics biology chemistry geology climate ' +
      'starlight sunspot moonbeam spacesuit launchpad magnetism',
    'Tools':
      'hammer wrench drill shovel rake pliers chisel ladder bolt nail screw tape glue rope chain hook pulley ' +
      'lever trowel scissors needle thread brush sandpaper toolbox flashlight lantern hatchet crowbar clamp ' +
      'anvil shears spade funnel stapler tweezers pickaxe padlock tripod',
    'School and office':
      'pencil ruler eraser crayon marker notebook paper folder binder desk chalk whiteboard blackboard lesson ' +
      'homework exam test quiz grade classroom diploma textbook dictionary alphabet spelling reading history ' +
      'science geography algebra language letter envelope stamp calendar schedule meeting printer monitor ' +
      'report essay project answer question principal semester recess paperclip sharpener',
    'Actions':
      'jump climb swim dance sing laugh smile whisper shout listen write read draw paint build carry throw ' +
      'catch kick push pull lift bounce float crawl creep march wander explore travel search discover imagine ' +
      'remember forget believe wonder breathe sneeze yawn sleep dream wake borrow teach learn study practice ' +
      'celebrate giggle juggle knit stitch fold wrap unwrap open close gather collect deliver arrive depart ' +
      'escape hide chase follow lead clap stretch tumble slide skip spin twirl balance shiver sprinkle ' +
      'scramble tiptoe',
    'Describing words':
      'happy brave calm clever gentle kind quiet loud bright dark heavy light quick slow tall short tiny huge ' +
      'giant ancient modern narrow wide smooth rough soft hard sharp fluffy shiny sparkly golden purple yellow ' +
      'green scarlet crimson frozen sunny cloudy windy rainy snowy stormy curious famous honest polite patient ' +
      'careful friendly generous cheerful peaceful wonderful beautiful delicious enormous gigantic hungry ' +
      'thirsty sleepy grumpy silly funny strange mysterious magical invisible fearless clumsy noisy busy empty ' +
      'crowded wobbly crunchy chilly',
    'Feelings':
      'love anger fear hope pride surprise delight worry sorrow excitement boredom jealousy courage kindness ' +
      'gratitude patience comfort relief panic envy bliss glee nervous lonely proud excited anxious grateful ' +
      'content joyful hopeful amazed puzzled relaxed thankful confident homesick',
  };
  var out = [], seen = {};
  for (var cat in CATS) {
    var list = CATS[cat].split(/\s+/);
    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      if (!/^[a-z]{4,10}$/.test(w) || seen[w]) continue;
      seen[w] = 1;
      out.push({ word: w, category: cat });
    }
  }
  window.HANGMAN_WORDS = out;
})();
