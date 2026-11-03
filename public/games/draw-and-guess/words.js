// Words to draw. Things most people can sketch in a minute and most people
// would recognise: objects, animals, food, places, jobs and actions.
window.DRAW_WORDS = `
apple banana cherry grapes lemon orange pear pineapple strawberry watermelon
carrot corn potato tomato broccoli mushroom pumpkin onion pepper avocado
bread cheese egg pizza burger hot dog sandwich taco sushi popcorn
cake cookie donut cupcake ice cream lollipop candy chocolate pancake waffle
coffee tea milk juice soup salad spaghetti fries pretzel cereal
dog cat mouse rabbit horse cow pig sheep goat chicken
duck owl eagle parrot penguin flamingo swan peacock crow bat
lion tiger bear wolf fox deer moose zebra giraffe elephant
monkey gorilla kangaroo koala panda camel hippo rhino squirrel hedgehog
snake turtle frog lizard crocodile dinosaur dragon unicorn
fish shark whale dolphin octopus jellyfish crab lobster starfish seahorse
butterfly bee ant spider ladybug snail worm mosquito caterpillar scorpion
tree flower rose sunflower cactus palm tree leaf mushroom grass bush
sun moon star cloud rain snow rainbow lightning tornado volcano
mountain river lake beach island desert forest cave waterfall iceberg
house castle tent igloo lighthouse bridge tower barn church skyscraper
school hospital library museum airport farm zoo park playground stadium
car bus truck train bicycle motorcycle scooter boat ship submarine
airplane helicopter rocket hot air balloon parachute tractor ambulance fire truck taxi skateboard
door window chair table bed couch lamp clock mirror ladder
bathtub toilet shower sink fridge oven microwave toaster kettle fan
cup plate bowl fork knife spoon pan teapot bottle jar
phone laptop computer keyboard mouse television camera headphones robot battery
book pencil pen eraser scissors ruler backpack notebook glue paintbrush
hat cap crown helmet glasses sunglasses scarf glove sock shoe
boot shirt dress skirt jacket tie belt umbrella purse wallet
ring necklace watch key lock coin money gift balloon candle
ball football basketball baseball tennis golf bowling soccer hockey boxing
kite yo-yo puzzle dice chess teddy bear doll drum guitar piano
violin trumpet microphone bell whistle magnet compass map flag trophy
hammer saw screwdriver wrench nail axe shovel rake bucket broom
sword shield bow arrow cannon anchor treasure pirate ninja knight
king queen prince princess wizard witch ghost vampire zombie mummy
alien astronaut doctor nurse teacher chef farmer firefighter police officer clown
baby grandma snowman mermaid superhero cowboy scientist artist dentist pilot
eye ear nose mouth tooth hand foot finger brain heart
skeleton bone skull muscle beard mustache hair tongue lips elbow
running swimming jumping dancing sleeping crying laughing singing reading cooking
fishing camping surfing skiing climbing painting juggling sneezing yawning waving
birthday wedding party picnic parade fireworks campfire snowball sandcastle christmas tree
halloween thanksgiving valentine easter egg pumpkin pie gingerbread man candy cane present snowflake
earth planet comet galaxy telescope satellite ufo black hole moon landing sunset
map globe pyramid statue windmill fountain well fence gate mailbox
traffic light stop sign road railroad tunnel parking lot gas station elevator escalator staircase
fire smoke ice water bubble shadow footprint puddle wave sand
spider web nest beehive egg feather paw tail horn wing
bandage pill syringe thermometer wheelchair crutch stethoscope microscope magnifying glass x-ray
money bag piggy bank shopping cart vending machine cash register credit card receipt barcode price tag ticket
pillow blanket alarm clock toothbrush toothpaste soap towel comb hairdryer razor
popsicle milkshake lemonade bacon sausage noodles dumpling burrito nachos pie
bulldozer crane forklift tank jet canoe sailboat train track windmill wheel
full moon shooting star solar system hourglass stopwatch calendar envelope stamp
`.split('\n').flatMap((line) => line.match(/hot dog|ice cream|palm tree|hot air balloon|fire truck|teddy bear|police officer|christmas tree|easter egg|pumpkin pie|gingerbread man|candy cane|black hole|moon landing|traffic light|stop sign|parking lot|gas station|spider web|magnifying glass|money bag|piggy bank|shopping cart|vending machine|cash register|credit card|price tag|alarm clock|train track|full moon|shooting star|solar system|[a-z-]+/g) || [])
