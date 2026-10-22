#!/usr/bin/env bash
# One-off check of which store websites expose product data a script can read.
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
probe() {
  local name="$1" url="$2"
  local f; f=$(mktemp)
  local meta; meta=$(curl -sL --compressed -A "$UA" -H 'Accept-Language: pl-PL,pl;q=0.9,is;q=0.8,en;q=0.7' --max-time 25 -o "$f" -w '%{http_code} %{content_type} %{size_download} %{url_effective}' "$url")
  echo "=== $name"
  echo "    $url"
  echo "    -> $meta"
  echo "    hits: price=$(grep -oiE 'price|cena|verð|verd' "$f" | wc -l) json-ld=$(grep -c 'application/ld+json' "$f") next=$(grep -c '__NEXT_DATA__' "$f") nuxt=$(grep -c '__NUXT__' "$f")"
  echo "    api urls: $(grep -oE 'https?://[a-zA-Z0-9.-]*(api|graphql)[a-zA-Z0-9./_-]*' "$f" | sort -u | head -8 | tr '\n' ' ')"
  echo "    sample: $(head -c 400 "$f" | tr '\n\r\t' '   ' | sed 's/  */ /g')"
  rm -f "$f"
}
probe frisco-api 'https://www.frisco.pl/app/commerce/api/v1/offer/products/query?purpose=Listing&pageIndex=1&search=mleko&includeFacets=false&deliveryMethod=Van&pageSize=5&language=pl'
probe frisco-search 'https://www.frisco.pl/q,mleko/stn,searchResults'
probe auchan 'https://zakupy.auchan.pl/search?q=mleko'
probe auchan-home 'https://zakupy.auchan.pl/'
probe carrefour 'https://www.carrefour.pl/szukaj?q=mleko'
probe carrefour-home 'https://www.carrefour.pl/'
probe biedronka-search 'https://www.biedronka.pl/pl/search?query=mleko'
probe biedronka-home 'https://www.biedronka.pl/pl'
probe lidl-api 'https://www.lidl.pl/q/api/search?q=mleko&assortment=PL&locale=pl_PL&version=v2.0.0'
probe lidl-search 'https://www.lidl.pl/q/search?q=mleko'
probe zabka 'https://www.zabka.pl/'
probe zabka-products 'https://www.zabka.pl/produkty'
probe wolt-venues 'https://restaurant-api.wolt.com/v1/pages/venue-list?lat=52.2297&lon=21.0122'
probe wolt-search 'https://restaurant-api.wolt.com/v1/pages/search?q=wolt%20market&lat=52.2297&lon=21.0122'
probe kronan 'https://kronan.is/'
probe kronan-search 'https://kronan.is/leit?q=mj%C3%B3lk'
probe netto 'https://netto.is/'
probe netto-search 'https://netto.is/leit?q=mj%C3%B3lk'
probe hagkaup 'https://www.hagkaup.is/'
probe hagkaup-search 'https://www.hagkaup.is/leit?q=mj%C3%B3lk'
probe bonus 'https://bonus.is/'
probe off-pl 'https://world.openfoodfacts.org/api/v2/search?countries_tags_en=poland&stores_tags=biedronka&fields=product_name,brands,stores,nutriments&page_size=3'
