#!/usr/bin/env bash
# One-off check of store data endpoints (round 4: shapes of the readable ones).
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
get() { curl -sL --compressed -A "$UA" -H 'Accept-Language: pl-PL,pl;q=0.9,is;q=0.8,en;q=0.7' --max-time 25 "$@"; }
shape() { python3 -c "
import json,sys
def walk(o,p='',d=0):
  if d>5: return
  if isinstance(o,dict):
    for k,v in list(o.items())[:40]:
      if isinstance(v,(dict,list)): print(p+k+':', type(v).__name__, len(v)); walk(v,p+'  ',d+1)
      else: print(p+k+':', repr(v)[:90])
  elif isinstance(o,list) and o:
    walk(o[0],p+'  [0] ',d+1)
try: walk(json.load(sys.stdin))
except Exception as e: print('not json',e)
" | head -${1:-80}; }
echo "=== kronan api root"; get 'https://api.kronan.is/api/v1/'; echo
echo "=== kronan public api page"; get 'https://kronan.is/kronan-public-api' | sed 's/<[^>]*>/ /g' | tr -s ' \n' ' ' | grep -oE '.{0,200}(api|API|token|Token|endpoint).{0,200}' | head -8
for u in 'https://api.kronan.is/api/v1/products/?search=skyr' 'https://api.kronan.is/api/v1/products/search/?q=skyr' 'https://api.kronan.is/api/v1/search/?q=skyr' 'https://api.kronan.is/api/v1/categories/'; do echo "--- $u"; get "$u" -w '\n%{http_code}\n' | tail -c 1200; echo; done
echo "=== frisco product detail"; get 'https://www.frisco.pl/app/commerce/api/v1/offer/products/query?purpose=Listing&pageIndex=1&search=twar%C3%B3g&includeFacets=false&deliveryMethod=Van&pageSize=1&language=pl' | shape 60
for u in 'https://www.frisco.pl/app/content/api/v1/products/get?productId=5312' 'https://commerce.frisco.pl/api/v1/integration/products/5312' 'https://www.frisco.pl/app/commerce/api/v1/offer/products/5312'; do echo "--- $u"; get "$u" -w '\n%{http_code}\n' | tail -c 900; echo; done
echo "=== wolt assortment shape"; get 'https://consumer-api.wolt.com/consumer-api/consumer-assortment/v1/venues/slug/wolt-market-centrum-2/assortment' | shape 60
echo "=== wolt category items"; cid=$(get 'https://consumer-api.wolt.com/consumer-api/consumer-assortment/v1/venues/slug/wolt-market-centrum-2/assortment' | python3 -c "import json,sys;d=json.load(sys.stdin);c=d['categories'];print(c[0].get('slug') or c[0]['id'])"); echo "cat $cid"
get "https://consumer-api.wolt.com/consumer-api/consumer-assortment/v1/venues/slug/wolt-market-centrum-2/assortment/categories/slug/$cid?language=pl" | shape 70
echo "=== auchan product object"; get 'https://zakupy.auchan.pl/search?q=twar%C3%B3g' > a.html; python3 - <<'PY'
import re,json
h=open('a.html',encoding='utf-8').read()
m=re.search(r'window\.__INITIAL_STATE__\s*=\s*(\{.*?\})\s*;?\s*</script>',h,re.S)
s=m.group(1); i=s.find('"brand":"Piątnica"'); j=s.rfind('{"',0,i-400)
print(s[i-1500:i+700])
PY
