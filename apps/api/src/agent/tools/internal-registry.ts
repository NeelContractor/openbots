import { bash, calculate, executeCode, getCurrentTime } from "./basic-system.js"
import { randomGenerator, unitConverter } from "./conversions-random.js"
import { parseDocument } from "./document-parser.js"
import { dnsLookup, fetchWebPage, httpRequest } from "./http-dns.js"
import { currencyConverter, getWeather, wikipediaSearch } from "./live-info.js"
import {
  generateUuid,
  jsonParser,
  textAnalyzer,
  transformText,
} from "./text-data.js"
import { webSearch } from "./web-search.js"

export const internalTools: Record<string, any> = {
  get_current_time: getCurrentTime,
  calculate: calculate,
  web_search: webSearch,
  fetch_web_page: fetchWebPage,
  http_request: httpRequest,
  json_parser: jsonParser,
  text_analyzer: textAnalyzer,
  execute_code: executeCode,
  generate_uuid: generateUuid,
  transform_text: transformText,
  unit_converter: unitConverter,
  random_generator: randomGenerator,
  get_weather: getWeather,
  wikipedia_search: wikipediaSearch,
  currency_converter: currencyConverter,
  dns_lookup: dnsLookup,
  bash: bash,
  parse_document: parseDocument,
}
