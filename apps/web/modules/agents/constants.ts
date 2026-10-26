export const TOOL_DESCRIPTIONS: Record<string, string> = {
  get_current_time: "Provides real-time timestamp and timezone calculations.",
  calculate:
    "Evaluates mathematical expressions safely without code evaluation.",
  create_schedule:
    "Creates delayed, relative, timestamped, or recurring scheduled runs.",
  manage_schedule:
    "Lists, modifies, reschedules, or cancels queued reminders and recurring tasks.",
  create_recurring_task:
    "Creates a recurring background task at a fixed interval (hourly, daily, weekly).",
  get_task_history:
    "Reads the history and results of previously executed scheduled tasks.",
  create_downloadable_file:
    "Generates a downloadable/previewable file (PDF, DOCX, XLSX, CSV, text, code) and shows a file card.",
  react_to_message: "Adds an emoji reaction to a message in the conversation.",
  parse_document:
    "Extracts text, tables, and metadata from PDF, DOCX, PPTX, XLSX, CSV, and text files.",
  search_memory:
    "Searches long-term persistent memory for user preferences, facts, and prior context.",
  save_memory:
    "Stores an important fact, preference, or instruction in long-term persistent memory.",
  delete_memory:
    "Deletes an outdated or incorrect fact from long-term persistent memory.",
  get_chat_history:
    "Reads earlier messages from the current conversation for additional context.",
  web_search:
    "Performs live web searches with snippets and source links via DuckDuckGo.",
  fetch_web_page:
    "Extracts readable text content and articles from public web pages.",
  http_request:
    "Makes direct REST API calls (GET, POST, PUT, DELETE) to any webhook or URL.",
  json_parser:
    "Parses, queries, and extracts specific fields from JSON payloads.",
  text_analyzer:
    "Calculates word counts, line counts, readability, and key terms.",
  execute_code:
    "Executes safe JavaScript/TypeScript logic, transformations, or data algorithms.",
  generate_uuid:
    "Generates cryptographic UUIDs, unique session tokens, or numeric IDs.",
  transform_text:
    "Transforms text formats: case conversion, Base64/URL encoding, slugify, or reverse.",
  unit_converter:
    "Converts metric, imperial, temperature, weight, volume, or digital storage units.",
  random_generator:
    "Generates random numbers, picks from choices, rolls dice, or shuffles lists.",
  get_weather:
    "Fetches live real-time weather, temperature, humidity, wind, and multi-day forecasts.",
  wikipedia_search:
    "Searches Wikipedia for articles, facts, biographies, concepts, and encyclopedia summaries.",
  currency_converter:
    "Fetches live global foreign exchange rates and converts currency amounts.",
  dns_lookup:
    "Performs DNS record lookups (A, AAAA, MX, TXT, CNAME, NS) via Google Public DNS.",
  bash: "Executes shell commands in a fresh isolated container to run scripts, compile code, or manage processes.",
}

export const DEFAULT_MODELS = [
  { id: "google/gemini-2.5-flash", displayName: "Gemini 2.5 Flash" },
  { id: "google/gemini-2.5-pro", displayName: "Gemini 2.5 Pro" },
  { id: "google/gemini-2.0-flash", displayName: "Gemini 2.0 Flash" },
]
