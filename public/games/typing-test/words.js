/* Typing Test word list: common English words, lower case, no punctuation.
   Plain array on window so index.html can load it with a classic script tag. */
window.TYPING_WORDS = (
  'the be to of and a in that have it for not on with he as you do at this but his by from they we ' +
  'say her she or an will my one all would there their what so up out if about who get which go me ' +
  'when make can like time no just him know take people into year your good some could them see other ' +
  'than then now look only come its over think also back after use two how our work first well way ' +
  'even new want because any these give day most us is was are been has had were said did made find ' +
  'here thing many long down little high old great small large next early young important few public ' +
  'bad same able last late hard real best better sure free full open short whole clear true low ' +
  'right left often never always still again around once ever both each every own such while where ' +
  'why place world life hand part child eye woman man home school state family student group country ' +
  'problem point company number night water room mother area money story fact month lot study book job ' +
  'word business issue side kind head house service friend father power hour game line end member law ' +
  'car city name team minute idea kid body back face others level office door health person art ' +
  'history party result change morning reason research girl guy moment air teacher force order ' +
  'form field plan light music road river table paper food land sound voice color street rule fire ' +
  'tree hill window letter picture class market top bottom heart test system program question ' +
  'government during without before under between against through above below across behind ' +
  'until since toward upon among within along already almost enough quite rather really maybe ' +
  'perhaps soon together however although yet tell ask feel try leave call keep let begin seem help ' +
  'talk turn start show hear play run move live believe hold bring happen write provide sit stand ' +
  'lose pay meet include continue set learn lead understand watch follow stop create speak read ' +
  'allow add spend grow offer remember love consider appear buy wait serve send expect build stay ' +
  'fall cut reach remain suggest raise pass sell require report decide pull open close walk ' +
  'carry drive break catch draw choose wear win fill plant cover throw finish answer travel ' +
  'nothing something everything anything someone everyone nobody another little much more less ' +
  'very too also each few many such own same so than then there here where which while ' +
  'north south east west summer winter spring autumn weather rain snow wind cloud sun moon star sky ' +
  'stone glass metal wood paper cotton gold silver iron bread milk sugar salt apple orange egg fish ' +
  'bird horse dog cat animal garden flower grass forest island ocean beach mountain valley desert ' +
  'train plane boat ship bridge station airport hotel shop bank church hospital library museum ' +
  'kitchen bed chair floor wall roof corner edge middle center circle square shape size weight ' +
  'number simple common special general human natural personal local social early ready happy ' +
  'quick slow warm cold hot dry wet dark bright quiet loud heavy light strong weak rich poor clean ' +
  'safe easy busy deep wide narrow fresh sweet soft final single double half third second minute'
).split(' ').filter(function (w, i, a) { return w && a.indexOf(w) === i; });
