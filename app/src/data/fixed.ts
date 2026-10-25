// Fixed data carried over from the single-file app (index.html, 0.17.x).
import ingredients from './ingredients.json';


/* ---------- Countries and stores ---------- */
export const COUNTRIES: any ={
  // Only stores whose products the daily job can read.
  PL:{name:'Poland',flag:'🇵🇱',locale:'pl',stores:['Frisco','Wolt Market']},
  IS:{name:'Iceland',flag:'🇮🇸',locale:'is',stores:['Krónan']}
};
export const COUNTRY_ORDER: any =['PL','IS'];
export const STORE_STYLE: any ={
  'Frisco':['#F28C28','#2A1400'],'Wolt Market':['#00A3E0','#002433'],'Krónan':['#E94E1B','#FFFFFF']
};

export const AISLES: any =[
  ['produce','Warzywa i owoce','Fruit & veg'],['meat','Mięso i ryby','Meat & fish'],['dairy','Nabiał i jaja','Dairy & eggs'],
  ['bread','Pieczywo','Bread'],['dry','Produkty sypkie','Dry goods'],['cans','Konserwy i przetwory','Tinned & jarred'],
  ['frozen','Mrożonki','Frozen'],['fats','Oleje i tłuszcze','Oils']
];

/* ---------- Built-in ingredients ----------
   key: [Polish, English, aisle, unit, protein, fat, carbs (per 100 g or ml),
         pack size (0 = sold loose), pack label, piece weight (g, 0 = none), image color, image shape]
   They live in ingredients.json so the daily store job and the meals.json check can read them too. */
export const ING_RAW: Record<string, any[]> = ingredients;


/* ---------- Products on the shelf ----------
   'Brand|Product name' per ingredient. A store entry without '|' swaps only the brand (the store's own label).
   These are typical examples, not checked against each store yet; real per-store products are a later update. */
export const PROD: any ={
  PL:{
    pomidor:'|Pomidory luz',ogorek:'|Ogórek zielony luz',papryka:'|Papryka czerwona luz',cebula:'|Cebula żółta',czosnek:'|Czosnek',
    brokul:'|Brokuł',szpinak:'Florette|Szpinak baby',marchew:'|Marchew',ziemniaki:'|Ziemniaki jadalne',kapusta:'|Kapusta biała',
    cukinia:'|Cukinia luz',dynia:'|Dynia hokkaido',rzodkiewki:'|Rzodkiewka',salata:'Florette|Mix sałat',rukola:'Florette|Rukola',
    banan:'|Banany luz',jablko:'|Jabłka luz',cytryna:'|Cytryny luz',szczypiorek:'|Szczypiorek',
    piers:'SuperDrob|Filet z piersi kurczaka',indyk_mielone:'Indykpol|Mięso mielone z indyka',indyk_filet:'Indykpol|Filet z piersi indyka',
    wolowina:'Sokołów|Rostbef wołowy',losos:'|Łosoś atlantycki, filet ze skórą',dorsz:'Frosta|Filet z dorsza',szynka:'Indykpol|Szynka z indyka w plastrach',
    jajka:'Fermy Drobiu Woźniak|Jaja ściółkowe M',twarog:'Piątnica|Twaróg półtłusty',skyr:'Piątnica|Skyr naturalny',jogurt:'Zott|Jogurt naturalny',
    serek:'Piątnica|Serek wiejski',feta:'Apetina|Ser feta',mleko:'Łaciate|Mleko 2%',kefir:'Mlekovita|Kefir',maslo:'Łaciate|Masło extra',
    chleb:'Mestemacher|Chleb żytni razowy',tortilla:'Mission|Tortille pełnoziarniste',
    platki:'Melvit|Płatki owsiane górskie',ryz:'Sonko|Ryż długoziarnisty',gryczana:'Kupiec|Kasza gryczana',jeczmienna:'Kupiec|Kasza jęczmienna pęczak',
    makaron:'Lubella|Makaron pełnoziarnisty penne',soczewica:'Sonko|Soczewica czerwona',maka:'Basia|Mąka pszenna razowa',
    wloskie:'Bakalland|Orzechy włoskie',migdaly:'Bakalland|Migdały',pestki:'Bakalland|Pestki dyni',
    tunczyk:'Graal|Tuńczyk w sosie własnym',pomidory_puszka:'Pudliszki|Pomidory krojone',fasola:'Bonduelle|Czerwona fasola',
    hummus:'Lavica Food|Hummus klasyczny',soja:'Kikkoman|Sos sojowy',
    maliny:'Hortex|Maliny mrożone',warzywa_mr:'Hortex|Warzywa na patelnię',fasolka:'Hortex|Fasolka szparagowa zielona',
    olej:'Kujawski|Olej rzepakowy',oliwa:'Monini|Oliwa z oliwek extra virgin'
  },
  IS:{
    pomidor:'Íslenskt grænmeti|Tomatoes',ogorek:'Íslenskt grænmeti|Cucumber',papryka:'Íslenskt grænmeti|Red pepper',cebula:'|Onions',czosnek:'|Garlic',
    brokul:'|Broccoli',szpinak:'|Baby spinach',marchew:'|Carrots',ziemniaki:'|Icelandic potatoes',kapusta:'|White cabbage',
    cukinia:'|Zucchini, loose',dynia:'|Hokkaido pumpkin',rzodkiewki:'|Radishes',salata:'Íslenskt grænmeti|Mixed salad leaves',rukola:'|Rocket',
    banan:'|Bananas, loose',jablko:'|Apples, loose',cytryna:'|Lemons, loose',szczypiorek:'|Chives',
    piers:'Holta|Chicken breast fillets',indyk_mielone:'Ísfugl|Ground turkey',indyk_filet:'Ísfugl|Turkey breast fillet',
    wolowina:'Kjarnafæði|Beef rump steak',losos:'|Icelandic salmon fillet',dorsz:'|Icelandic cod fillet',szynka:'SS|Turkey ham slices',
    jajka:'Nesbú|Eggs',twarog:'|Quark',skyr:'MS|Ísey Skyr plain',jogurt:'MS|Plain yoghurt',
    serek:'MS|Kotasæla cottage cheese',feta:'MS|Feta cheese',mleko:'MS|Léttmjólk low-fat milk',kefir:'MS|AB-mjólk',maslo:'MS|Butter',
    chleb:'Myllan|Wholegrain rye bread',tortilla:'Mission|Wholegrain wraps',
    platki:'Ota|Sólgrjón rolled oats',ryz:'Tilda|Long grain rice',gryczana:'Himneskt|Buckwheat',jeczmienna:'Móðir Jörð|Icelandic pearl barley',
    makaron:'Barilla|Wholegrain penne',soczewica:'Himneskt|Red lentils',maka:'Kornax|Wholemeal flour',
    wloskie:'Himneskt|Walnuts',migdaly:'Himneskt|Almonds',pestki:'Himneskt|Pumpkin seeds',
    tunczyk:'Ora|Tuna in brine',pomidory_puszka:'Mutti|Chopped tomatoes',fasola:'Ora|Red kidney beans',
    hummus:'|Hummus',soja:'Kikkoman|Soy sauce',
    maliny:'|Frozen raspberries',warzywa_mr:'|Frozen stir-fry vegetables',fasolka:'|Frozen green beans',
    olej:'|Rapeseed oil',oliwa:'Filippo Berio|Extra virgin olive oil'
  }
};

/* ---------- Meals (grams per suggested portion) ---------- */
export const FALLBACK_MEALS: any[] =[
 {id:'jajecznica',name:'Scrambled eggs with tomato and rye bread',pl:'Jajecznica z pomidorem i chlebem razowym',types:['breakfast'],mins:10,style:'plate',
  desc:'Soft scrambled eggs with fresh tomato and two slices of rye bread. Quick, filling and good for a busy morning.',
  ing:[['jajka',150],['pomidor',120],['chleb',70],['olej',5]],
  steps:['Beat the eggs with a pinch of salt.','Dice the tomato and soften it in the oil over medium heat for 2 minutes.','Pour in the eggs and stir gently until just set.','Serve with the bread.']},
 {id:'twarog_maliny',name:'Quark with raspberries and walnuts',pl:'Twaróg z malinami i orzechami',types:['breakfast'],mins:5,style:'bowl',base:'twarog',
  desc:'A high-protein bowl of Polish quark with tart raspberries and crunchy walnuts. No cooking needed.',
  ing:[['twarog',200],['maliny',100],['wloskie',15]],
  steps:['Thaw the raspberries in the fridge overnight or for 2 minutes in the microwave.','Loosen the quark with a spoon of water if it is very dry.','Top with the raspberries and chopped walnuts.']},
 {id:'owsianka_skyr',name:'Oats with skyr and banana',pl:'Owsianka ze skyrem i bananem',types:['breakfast'],mins:8,style:'bowl',base:'platki',
  desc:'Creamy porridge cooked in milk, topped with skyr for extra protein and a sliced banana.',
  ing:[['platki',50],['mleko',150],['skyr',150],['banan',120]],
  steps:['Simmer the oats in the milk for 4 minutes, stirring now and then.','Let it cool for a minute so the skyr stays cold and creamy.','Top with the skyr and sliced banana.']},
 {id:'omlet_feta',name:'Spinach and feta omelette',pl:'Omlet ze szpinakiem i fetą',types:['breakfast'],mins:10,style:'plate',
  desc:'A fluffy omelette folded around wilted spinach and salty feta, with a slice of rye bread.',
  ing:[['jajka',150],['szpinak',50],['feta',30],['chleb',35],['olej',3]],
  steps:['Wilt the spinach in the oil in a non-stick pan for 1 minute.','Pour in the beaten eggs and tilt the pan to spread them.','Crumble the feta over one half, cook until set, then fold.','Serve with the bread.']},
 {id:'kanapki_twarog',name:'Open sandwiches with quark and radish',pl:'Kanapki z twarogiem i rzodkiewką',types:['breakfast'],mins:5,style:'plate',
  desc:'A classic Polish breakfast: rye bread spread with quark, topped with radish and chives.',
  ing:[['chleb',105],['twarog',150],['rzodkiewki',50],['szczypiorek',5]],
  steps:['Mix the quark with a pinch of salt and pepper.','Spread it on the bread.','Top with sliced radish and chopped chives.']},
 {id:'kurczak_ryz',name:'Chicken, rice and broccoli',pl:'Kurczak z ryżem i brokułem',types:['lunch','dinner'],mins:25,style:'plate',
  desc:'The meal-prep classic: seared chicken breast, fluffy rice and steamed broccoli.',
  ing:[['piers',150],['ryz',70],['brokul',150],['olej',5]],
  steps:['Rinse the rice and cook it in 150 ml of water for 12 minutes, then rest it covered.','Slice the chicken, season with salt, pepper and paprika.','Sear it in the oil for 6 to 7 minutes until cooked through.','Steam the broccoli florets for 4 minutes and serve everything together.']},
 {id:'chili_indyk',name:'Turkey chili with beans',pl:'Chili z indyka i fasolą',types:['lunch','dinner'],mins:35,style:'bowl',base:'pomidory_puszka',
  desc:'A lean, smoky chili with ground turkey, kidney beans and peppers. Even better the next day.',
  ing:[['indyk_mielone',150],['fasola',120],['pomidory_puszka',200],['cebula',60],['papryka',100],['czosnek',5],['olej',5]],
  steps:['Soften the diced onion and garlic in the oil for 3 minutes.','Add the turkey and brown it, breaking it up.','Stir in the diced pepper, tomatoes, drained beans, paprika and cumin.','Simmer for 20 minutes and season to taste.']},
 {id:'makaron_tunczyk',name:'Wholegrain pasta with tuna and tomato',pl:'Makaron razowy z tuńczykiem i pomidorami',types:['lunch','dinner'],mins:20,style:'plate',
  desc:'A pantry-friendly pasta with a quick garlic and tomato sauce, tuna and fresh rocket.',
  ing:[['makaron',70],['tunczyk',80],['pomidory_puszka',150],['czosnek',5],['oliwa',5],['rukola',30]],
  steps:['Cook the pasta in salted water until al dente.','Warm the sliced garlic in the olive oil, add the tomatoes and simmer for 8 minutes.','Fold in the drained tuna and the pasta.','Finish with rocket.']},
 {id:'losos_kasza',name:'Baked salmon with buckwheat and broccoli',pl:'Pieczony łosoś z kaszą gryczaną',types:['dinner'],mins:25,style:'plate',
  desc:'Oven-baked salmon with lemon, nutty buckwheat groats and broccoli. Rich in omega-3.',
  ing:[['losos',120],['gryczana',60],['brokul',120],['cytryna',20]],
  steps:['Heat the oven to 200 °C.','Season the salmon, squeeze over the lemon and bake for 12 minutes.','Cook the buckwheat in twice its volume of water for 15 minutes.','Steam the broccoli and serve together.']},
 {id:'salatka_kurczak',name:'Chicken and feta salad',pl:'Sałatka z kurczakiem i fetą',types:['lunch'],mins:15,style:'plate',
  desc:'A crunchy salad with grilled chicken, feta, cucumber and tomato, with rye bread on the side.',
  ing:[['piers',130],['salata',80],['ogorek',100],['pomidor',120],['feta',30],['oliwa',10],['chleb',35]],
  steps:['Season and pan-fry the chicken for 6 minutes, then slice it.','Chop the cucumber and tomato.','Toss everything with the leaves, crumbled feta and olive oil.','Serve with the bread.']},
 {id:'pomidorowa',name:'Tomato soup with rice and turkey meatballs',pl:'Zupa pomidorowa z ryżem i klopsikami',types:['lunch','dinner'],mins:35,style:'bowl',base:'pomidory_puszka',
  desc:'A lighter take on Polish pomidorowa with small turkey meatballs and rice.',
  ing:[['indyk_mielone',120],['ryz',40],['pomidory_puszka',250],['marchew',50],['cebula',30]],
  steps:['Simmer the grated carrot, onion and tomatoes in 400 ml of water for 15 minutes.','Roll the seasoned turkey into small meatballs.','Drop them into the soup and cook for 10 minutes.','Cook the rice separately and serve the soup over it.']},
 {id:'kurczak_ziemniaki',name:'Roast chicken with potatoes and slaw',pl:'Kurczak z ziemniakami i surówką',types:['lunch','dinner'],mins:35,style:'plate',
  desc:'Roast chicken and potato wedges with a fresh cabbage and carrot slaw in yoghurt.',
  ing:[['piers',150],['ziemniaki',250],['kapusta',100],['marchew',50],['jogurt',50],['oliwa',5]],
  steps:['Heat the oven to 200 °C.','Toss the potato wedges in the oil and roast for 15 minutes.','Add the seasoned chicken and roast for 20 minutes more.','Shred the cabbage and carrot and mix with the yoghurt and salt.']},
 {id:'szakszuka',name:'Shakshuka with feta',pl:'Szakszuka z fetą',types:['breakfast','dinner'],mins:25,style:'bowl',base:'pomidory_puszka',
  desc:'Eggs gently poached in a spiced tomato and pepper sauce, topped with feta.',
  ing:[['jajka',150],['pomidory_puszka',200],['papryka',100],['cebula',50],['feta',30],['chleb',35],['olej',5]],
  steps:['Soften the onion and pepper in the oil for 5 minutes.','Add the tomatoes, paprika and cumin and simmer for 10 minutes.','Make three wells, crack in the eggs, cover and cook for 6 minutes.','Crumble over the feta and serve with the bread.']},
 {id:'dorsz_ziemniaki',name:'Cod with potatoes and green beans',pl:'Dorsz z ziemniakami i fasolką',types:['dinner'],mins:25,style:'plate',
  desc:'Pan-fried cod in a little butter with lemon, boiled potatoes and green beans.',
  ing:[['dorsz',180],['ziemniaki',250],['fasolka',150],['maslo',10],['cytryna',20]],
  steps:['Boil the potatoes in salted water for 18 minutes.','Cook the green beans for 6 minutes.','Pan-fry the cod in the butter for 3 minutes per side.','Squeeze over the lemon and serve.']},
 {id:'wrap_kurczak',name:'Chicken wrap with yoghurt sauce',pl:'Tortilla z kurczakiem i sosem jogurtowym',types:['lunch'],mins:15,style:'plate',
  desc:'A wholewheat wrap with chicken, crisp vegetables and a garlicky yoghurt sauce.',
  ing:[['tortilla',62],['piers',130],['jogurt',60],['salata',40],['ogorek',60],['pomidor',60],['olej',3]],
  steps:['Pan-fry the sliced chicken in the oil for 6 minutes.','Mix the yoghurt with salt and a little garlic.','Fill the tortilla with the sauce, vegetables and chicken.','Roll it up tightly and cut in half.']},
 {id:'wolowina_ryz',name:'Beef stir-fry with rice',pl:'Wołowina z warzywami i ryżem',types:['dinner'],mins:20,style:'plate',
  desc:'Thin strips of beef and mixed vegetables in soy sauce, served with rice.',
  ing:[['wolowina',130],['warzywa_mr',200],['ryz',60],['soja',15],['olej',5]],
  steps:['Cook the rice.','Stir-fry the thin beef strips in the hot oil for 2 minutes and set aside.','Stir-fry the frozen vegetables for 5 minutes.','Return the beef, add the soy sauce and toss for 1 minute.']},
 {id:'placki_cukinia',name:'Zucchini fritters with yoghurt',pl:'Placki z cukinii z jogurtem',types:['lunch','dinner'],mins:25,style:'plate',
  desc:'Crisp zucchini fritters served with cool natural yoghurt.',
  ing:[['cukinia',250],['jajka',100],['maka',40],['jogurt',100],['olej',8]],
  steps:['Grate the zucchini, salt it and squeeze out the water after 5 minutes.','Mix with the eggs and flour.','Fry small fritters in the oil for 3 minutes per side.','Serve with the yoghurt.']},
 {id:'gulasz_indyk',name:'Turkey goulash with pearl barley',pl:'Gulasz z indyka z kaszą jęczmienną',types:['dinner'],mins:40,style:'bowl',base:'pomidory_puszka',
  desc:'A paprika-rich turkey and pepper goulash served on pearl barley.',
  ing:[['indyk_filet',150],['papryka',150],['cebula',50],['pomidory_puszka',150],['jeczmienna',60],['olej',5]],
  steps:['Brown the diced turkey with the onion in the oil.','Add the pepper, tomatoes and sweet paprika.','Simmer covered for 25 minutes.','Cook the barley and serve the goulash over it.']},
 {id:'zupa_dynia',name:'Red lentil and pumpkin soup',pl:'Krem z dyni i czerwonej soczewicy',types:['lunch'],mins:30,style:'bowl',base:'dynia',
  desc:'A velvety, naturally sweet soup with red lentils, topped with pumpkin seeds.',
  ing:[['soczewica',60],['dynia',250],['cebula',50],['pestki',10],['chleb',35]],
  steps:['Dice the pumpkin and onion.','Simmer them with the lentils in 500 ml of water for 20 minutes.','Blend until smooth and season.','Top with pumpkin seeds and serve with the bread.']},
 {id:'skyr_jablko',name:'Skyr with apple',pl:'Skyr z jabłkiem',types:['snack'],mins:3,style:'bowl',base:'skyr',
  desc:'A cold, high-protein snack with crisp apple.',
  ing:[['skyr',150],['jablko',180]],
  steps:['Dice the apple.','Stir it into the skyr, with cinnamon if you like.']},
 {id:'serek_pomidor',name:'Cottage cheese with tomato and chives',pl:'Serek wiejski z pomidorem i szczypiorkiem',types:['snack'],mins:3,style:'bowl',base:'serek',
  desc:'Polish serek wiejski with juicy tomato and chives.',
  ing:[['serek',200],['pomidor',120],['szczypiorek',5]],
  steps:['Dice the tomato.','Mix with the cottage cheese and chopped chives, then season with pepper.']},
 {id:'hummus_warzywa',name:'Hummus with carrot and pepper sticks',pl:'Hummus z marchewką i papryką',types:['snack'],mins:5,style:'plate',
  desc:'Crunchy vegetable sticks with creamy hummus.',
  ing:[['hummus',60],['marchew',100],['papryka',100]],
  steps:['Cut the carrot and pepper into sticks.','Serve with the hummus for dipping.']},
 {id:'kanapka_indyk',name:'Turkey ham sandwich',pl:'Kanapka z szynką z indyka',types:['snack'],mins:3,style:'plate',
  desc:'Rye bread with lean turkey ham and cucumber.',
  ing:[['chleb',70],['szynka',60],['ogorek',60]],
  steps:['Layer the ham and sliced cucumber on the bread.']},
 {id:'kefir_migdaly',name:'Kefir with almonds',pl:'Kefir z migdałami',types:['snack'],mins:1,style:'bowl',base:'kefir',
  desc:'A glass of kefir with a handful of almonds.',
  ing:[['kefir',250],['migdaly',20]],
  steps:['Pour the kefir and serve the almonds alongside.']},
 {id:'jajka_pomidor',name:'Two boiled eggs with tomato',pl:'Jajka na twardo z pomidorem',types:['snack'],mins:12,style:'plate',
  desc:'Simple, satisfying and easy to prepare ahead.',
  ing:[['jajka',100],['pomidor',120]],
  steps:['Boil the eggs for 9 minutes, then cool them in cold water.','Peel, halve and serve with the sliced tomato.']}
];

// meat, fish, animal (vegetarian but not vegan); anything missing is plant-based.
export const BASE_DIET: any ={piers:'meat',indyk_mielone:'meat',indyk_filet:'meat',wolowina:'meat',szynka:'meat',losos:'fish',dorsz:'fish',tunczyk:'fish',
  jajka:'animal',twarog:'animal',skyr:'animal',jogurt:'animal',serek:'animal',feta:'animal',mleko:'animal',kefir:'animal',maslo:'animal'};

export const DAYS: any =['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const DAYS_SHORT: any =['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export const SLOTS: any =['breakfast','lunch','snack','dinner','snack'];
export const SLOT_LABEL: any ={breakfast:'Breakfast',lunch:'Lunch',dinner:'Dinner',snack:'Snack'};
export const SLOT_SHARE: any ={breakfast:0.25,lunch:0.3,dinner:0.3,snack:0.075};
export const TYPES: any =['breakfast','lunch','dinner','snack'];

/* ---------- Categories ----------
   Some come from the numbers (protein, calories, carbs, time, ingredients), the rest from the catalog's tags. */
export const CATS: any =[['protein','High protein'],['light','Low calorie'],['lowcarb','Low carb'],['sweet','Sweet'],['quick','Quick'],['vegetarian','Vegetarian'],['vegan','Vegan'],
  ['fish','Fish & seafood'],['soup','Soups'],['nocook','No cooking'],['mealprep','Meal prep'],['polish','Polish classics'],['icelandic','Icelandic'],['spicy','Spicy']];
export const CAT_LABEL: Record<string, string> = {};
CATS.forEach(function (c: any) { CAT_LABEL[c[0]] = c[1]; });

export const ING_EMOJI: any ={pomidor:'🍅',ogorek:'🥒',papryka:'🫑',cebula:'🧅',czosnek:'🧄',brokul:'🥦',szpinak:'🥬',marchew:'🥕',ziemniaki:'🥔',kapusta:'🥬',
  cukinia:'🥒',dynia:'🎃',rzodkiewki:'🌱',salata:'🥗',rukola:'🌿',banan:'🍌',jablko:'🍎',cytryna:'🍋',szczypiorek:'🌿',
  piers:'🍗',indyk_mielone:'🥩',indyk_filet:'🦃',wolowina:'🥩',losos:'🐟',dorsz:'🐟',szynka:'🥓',
  jajka:'🥚',twarog:'🧀',skyr:'🥛',jogurt:'🥛',serek:'🧀',feta:'🧀',mleko:'🥛',kefir:'🥛',maslo:'🧈',chleb:'🍞',tortilla:'🫓',
  platki:'🥣',ryz:'🍚',gryczana:'🌾',jeczmienna:'🌾',makaron:'🍝',soczewica:'🫘',maka:'🌾',wloskie:'🌰',migdaly:'🌰',pestki:'🎃',
  tunczyk:'🐟',pomidory_puszka:'🥫',fasola:'🫘',hummus:'🫘',soja:'🍶',maliny:'🍓',warzywa_mr:'🥦',fasolka:'🫛',olej:'🌼',oliwa:'🫒',
  ciecierzyca:'🫘',fasola_biala:'🫘',kukurydza:'🌽',groszek:'🫛',szpinak_mr:'🥬',owoce_lesne:'🫐',mango:'🥭',pierogi:'🥟',krewetki:'🦐',
  quinoa:'🌾',kuskus:'🌾',bulgur:'🌾',ryz_brazowy:'🍚',jaglana:'🌾',makaron_ryzowy:'🍜',spaghetti:'🍝',gnocchi:'🥔',bulka_tarta:'🍞',odzywka:'🥤',
  maslo_orzechowe:'🥜',miod:'🍯',kakao:'🍫',czekolada:'🍫',daktyle:'🌴',rodzynki:'🍇',chia:'🌱',sezam:'🌱',slonecznik:'🌻',nerkowce:'🥜',orzeszki:'🥜',
  wafle:'🍘',grahamka:'🥯',pita:'🫓',tost:'🍞',flatkaka:'🫓',batat:'🍠',pieczarki:'🍄',awokado:'🥑',borowki:'🫐',truskawki:'🍓',gruszka:'🍐',
  pomarancza:'🍊',kiwi:'🥝',burak:'🫜',cebula_czerwona:'🧅',por:'🥬',seler:'🥬',kalafior:'🥦',baklazan:'🍆',jarmuz:'🥬',pomidorki:'🍅',limonka:'🍋‍🟩',
  imbir:'🫚',koperek:'🌿',pietruszka:'🌿',schab:'🥩',poledwiczka:'🥩',wolowina_mielona:'🥩',udka:'🍗',jagniecina:'🍖',kielbasa:'🌭',losos_wedz:'🐟',
  makrela:'🐟',sledz:'🐟',ysa:'🐟',bleikja:'🐟',tofu:'🧊',twarog_chudy:'🧀',jogurt_grecki:'🥛',mozzarella:'🧀',parmezan:'🧀',ser_zolty:'🧀',
  serek_smietankowy:'🧀',ricotta:'🧀',halloumi:'🧀',smietana:'🥛',napoj_sojowy:'🥛',mleczko_kokosowe:'🥥',passata:'🥫',koncentrat:'🥫',
  kapusta_kiszona:'🥬',ogorki_kiszone:'🥒',oliwki:'🫒',pesto:'🌿',pasta_curry:'🌶️',ryba_puszka:'🐟'};
// Anything not listed above falls back to its aisle's emoji.
export const AISLE_EMOJI: any ={produce:'🥬',meat:'🥩',dairy:'🧀',bread:'🍞',dry:'🌾',cans:'🥫',frozen:'❄️',fats:'🫒'};
// Each aisle's picture: a tinted tile with three of its foods.
export const AISLE_ART: any ={produce:['#DDEFD3','🥕','🍅','🥦'],meat:['#F6DCD6','🥩','🍗','🐟'],dairy:['#E2EAF5','🧀','🥛','🥚'],bread:['#F4E4C9','🫓','🍞','🥐'],
  dry:['#EFE5CF','🍚','🍝','🌰'],cans:['#F4DDD0','🫘','🥫','🍶'],frozen:['#D8ECF2','🍓','❄️','🫛'],fats:['#EBEFD0','🧈','🫒','🫗']};

export const STEP_G: any ={pietruszka:10,koperek:10,imbir:10,parmezan:20,pesto:20,miod:10,kakao:10,czekolada:20,chia:10,sezam:10,slonecznik:10,nerkowce:15,orzeszki:15,rodzynki:15,daktyle:20,maslo_orzechowe:15,odzywka:30,bulka_tarta:20,oliwki:30,koncentrat:15,pasta_curry:15,smietana:30,serek_smietankowy:30,
  quinoa:50,kuskus:50,bulgur:50,ryz_brazowy:50,jaglana:50,makaron_ryzowy:50,spaghetti:50,czosnek:5,maslo:10,wloskie:15,migdaly:15,pestki:10,feta:50,szczypiorek:5,hummus:30,soja:10,olej:10,oliwa:10,platki:50,ryz:50,gryczana:50,jeczmienna:50,makaron:50,soczewica:50,maka:50};

export const MIXCOLS: any =['#EE8A2B','#4E8A3A','#E8542F','#F4D77A','#9CC87A'];
export const SHAPE_COUNT: any ={grain:80,crumble:34,curd:46,round:5,coin:6,stick:9,bit:9,floret:6,leaf:9,chunk:7,shred:18,wedge:1,herb:12,slab:1,strip:8,slice:2,egg:5,mound:1,cube:8,bread:2,wrap:1,pasta:24,nut:5,seed:14,sauce:0,bean:14,berry:9,mix:16,none:0};

