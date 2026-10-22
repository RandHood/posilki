#!/usr/bin/env bash
# One-off check of which store websites expose product data a script can read (round 2: look inside).
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
get() { curl -sL --compressed -A "$UA" -H 'Accept-Language: pl-PL,pl;q=0.9,is;q=0.8,en;q=0.7' --max-time 25 "$@"; }
echo "=== frisco product"; get 'https://www.frisco.pl/app/commerce/api/v1/offer/products/query?purpose=Listing&pageIndex=1&search=twar%C3%B3g&includeFacets=false&deliveryMethod=Van&pageSize=2&language=pl' | head -c 2500; echo
echo "=== auchan json-ld + data"; get 'https://zakupy.auchan.pl/search?q=twar%C3%B3g' > a.html; grep -o '<script type="application/ld+json"[^>]*>[^<]*' a.html | head -c 1500; echo; grep -oE '"(name|brand|price|grammage|weight)":"?[^,"]{1,60}' a.html | head -30 | tr '\n' ' '; echo; grep -oE 'window\.__[A-Z_]+__' a.html | sort -u
echo "=== lidl api items"; get 'https://www.lidl.pl/q/api/search?q=twar%C3%B3g&assortment=PL&locale=pl_PL&version=v2.0.0' | python3 -c "
import json,sys
d=json.load(sys.stdin)
items=d.get('items',[])
print('items',len(items), 'keys', list(d.keys())[:15])
for it in items[:6]:
  g=it.get('gridbox',{}).get('data',{})
  print(' -', g.get('fullTitle') or g.get('title'), '|', g.get('brand',{}).get('name') if isinstance(g.get('brand'),dict) else g.get('brand'), '|', g.get('price',{}).get('price') if isinstance(g.get('price'),dict) else '', '|', g.get('category'), '|', g.get('stockAvailability',{}).get('onlineAvailable') if isinstance(g.get('stockAvailability'),dict) else '', '|', (g.get('price') or {}).get('packaging',{}).get('text') if isinstance(g.get('price'),dict) else '')
"
echo "=== biedronka search body"; get 'https://www.biedronka.pl/pl/search?query=twar%C3%B3g' | sed 's/<[^>]*>/ /g' | tr -s ' \n' ' ' | head -c 1500; echo
echo "=== biedronka product listing"; get 'https://www.biedronka.pl/pl/nabial' -o b.html -w '%{http_code} %{size_download}\n'; sed 's/<[^>]*>/ /g' b.html | tr -s ' \n' ' ' | head -c 800; echo
echo "=== zabka home text"; get 'https://www.zabka.pl/' | grep -oE '(product|produkt)[^"]{0,80}' | sort -u | head -20
echo "=== zabka oferta"; get 'https://www.zabka.pl/oferta' -o z.html -w '%{http_code} %{size_download}\n'; grep -oE 'class="[^"]*product[^"]*"' z.html | sort | uniq -c | head; sed 's/<[^>]*>/ /g' z.html | tr -s ' \n' ' ' | head -c 800; echo
echo "=== kronan search"; get 'https://kronan.is/leit?q=skyr' > k.html; grep -oE '"(name|title|price|brand)":"?[^,"]{1,60}' k.html | head -30 | tr '\n' ' '; echo; sed 's/<[^>]*>/ /g' k.html | tr -s ' \n' ' ' | grep -oE '.{0,40}kr\.?.{0,40}' | head -8
echo "=== kronan api hints"; grep -oE 'https://[a-z.]*kronan\.is/[a-zA-Z0-9/_.-]*' k.html | sort -u | head -15
echo "=== hagkaup search"; get 'https://www.hagkaup.is/leit?q=skyr' > h.html; sed 's/<[^>]*>/ /g' h.html | tr -s ' \n' ' ' | grep -oE '.{0,60}kr\.?.{0,30}' | head -8; grep -oE 'https://[a-z.]*hagkaup[a-z.]*/[a-zA-Z0-9/_.-]*api[a-zA-Z0-9/_.-]*' h.html | sort -u | head
echo "=== netto shop"; for u in 'https://www.netto.is/netverslun' 'https://netto.is/vorur' 'https://www.samkaup.is/' 'https://netverslun.netto.is/'; do printf '%s ' "$u"; get "$u" -o n.html -w '%{http_code} %{size_download} %{url_effective}\n'; done
echo "=== bonus pages"; get 'https://bonus.is/' | grep -oE 'href="https://bonus\.is/[^"]*"' | sort -u | head -20
echo "=== wolt consumer api"; get 'https://consumer-api.wolt.com/v1/pages/front?lat=52.2297&lon=21.0122' -o w.json -w '%{http_code} %{size_download}\n'; grep -oE '"slug":"[^"]*market[^"]*"' w.json | sort -u | head
