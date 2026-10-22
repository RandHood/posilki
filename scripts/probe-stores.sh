#!/usr/bin/env bash
# One-off check of which store websites expose product data a script can read (round 3).
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
get() { curl -sL --compressed -A "$UA" -H 'Accept-Language: pl-PL,pl;q=0.9,is;q=0.8,en;q=0.7' --max-time 25 "$@"; }
echo "=== kronan public api link"; get 'https://kronan.is/' | grep -oE 'href="[^"]*"[^>]*>[^<]*(API|Api)[^<]*' | head -3
get 'https://kronan.is/' | grep -oE 'https?://[a-zA-Z0-9.-]*(api|docs|developer)[a-zA-Z0-9.-]*\.[a-z]+[^"\\ ]*' | sort -u | head -10
for u in 'https://api.kronan.is/' 'https://api.kronan.is/api/v1/' 'https://api.kronan.is/docs' 'https://kronan.is/api'; do printf '%s ' "$u"; get "$u" -o x -w '%{http_code} %{content_type} %{size_download}\n'; head -c 300 x | tr '\n' ' '; echo; done
echo "=== kronan product page sample"; get 'https://kronan.is/leit?q=skyr' | grep -oE '\\"(name|title|price|brand|sku|slug)\\":\\"[^\\]{1,60}' | head -20 | tr '\n' ' '; echo
echo "=== wolt assortment"; get 'https://consumer-api.wolt.com/consumer-api/consumer-assortment/v1/venues/slug/wolt-market-centrum-2/assortment' -o w.json -w '%{http_code} %{size_download}\n'; head -c 600 w.json; echo
get 'https://consumer-api.wolt.com/consumer-api/consumer-assortment/v1/venues/slug/wolt-market-centrum-2/assortment/items/search?q=twar%C3%B3g&language=pl' -o ws.json -w 'search %{http_code} %{size_download}\n'; head -c 800 ws.json; echo
echo "=== auchan state"; get 'https://zakupy.auchan.pl/search?q=twar%C3%B3g' > a.html; python3 - <<'PY'
import re,json
h=open('a.html',encoding='utf-8').read()
for var in ['__INITIAL_STATE__','__URQL_DATA__','__QUERY_INITIAL_STATE__']:
    m=re.search(r'window\.'+var+r'\s*=\s*(\{.*?\})\s*;?\s*</script>',h,re.S)
    if not m: print(var,'not found'); continue
    s=m.group(1)
    print(var,len(s))
    for k in ['"name"','"brand"','"price"','"grammage"','"ean"','"nutrition','"energy']:
        i=s.find(k); print('  ',k, s[i:i+160].replace('\n',' ') if i>-1 else '-')
PY
echo "=== netto / samkaup"; get 'https://www.samkaup.is/' | grep -oE 'href="https?://[^"]*"' | sort -u | head -15
for u in 'https://netto.is/vefverslun' 'https://www.netto.is/vefverslun'; do printf '%s ' "$u"; get "$u" -o x -w '%{http_code} %{size_download} %{url_effective}\n'; done
echo "=== hagkaup food"; get 'https://www.hagkaup.is/' | grep -oE 'href="/[^"]*"' | sort -u | head -30 | tr '\n' ' '; echo
echo "=== carrefour with browser headers"; get -H 'Accept: text/html' 'https://www.carrefour.pl/artykuly-spozywcze' -o x -w '%{http_code} %{size_download}\n'
echo "=== zabka oferta products"; get 'https://www.zabka.pl/oferta' | grep -oE 'product-item-content__(title|grammage)[^>]*>[^<]{1,80}' | head -15
