# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any shell command containing `curl` or `wget` will be intercepted and blocked by the context-mode plugin. Do NOT retry.
Instead use:
- `context-mode_ctx_fetch_and_index(url, source)` to fetch and index web pages
- `context-mode_ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any shell command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` will be intercepted and blocked. Do NOT retry with shell.
Instead use:
- `context-mode_ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### Direct web fetching — BLOCKED
Do NOT use any direct URL fetching tool. Use the sandbox equivalent.
Instead use:
- `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Shell (>20 lines output)
Shell is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `context-mode_ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `context-mode_ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### File reading (for analysis)
If you are reading a file to **edit** it → reading is correct (edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `context-mode_ctx_execute_file(path, language, code)` instead. Only your printed summary enters context.

### grep / search (large results)
Search results can flood context. Use `context-mode_ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Serena Code Intelligence — PREFERRED for code operations

When working with codebases, **Serena tools are strongly preferred** over raw file operations. Serena provides IDE-level semantic understanding:

### Symbol-Level Navigation (USE THESE)
| Instead of | Use Serena |
|------------|-----------|
| `grep` for function definitions | `serena_find_symbol(name_path_pattern)` — finds symbols by name across the codebase |
| Reading entire files to understand structure | `serena_get_symbols_overview(relative_path)` — hierarchical outline without reading full file |
| `grep` to find where a function is called | `serena_find_referencing_symbols(name_path)` — finds all references with context |
| Manual file exploration | `serena_search_symbols(query)` — semantic symbol search |

### Symbol-Level Editing (USE THESE)
| Instead of | Use Serena |
|------------|-----------|
| Line-based replacements | `serena_replace_symbol_body(name_path, body)` — replace entire symbol definition |
| Inserting code at line numbers | `serena_insert_after_symbol(name_path, body)` / `serena_insert_before_symbol(name_path, body)` — insert relative to symbols |
| Find-and-replace renaming | `serena_rename_symbol(name_path, new_name)` — renames across all files with reference updates |
| Deleting code manually | `serena_safe_delete_symbol(name_path)` — deletes only if no references exist |

### Project Understanding
- `serena_onboard_project()` — analyze project structure, detect languages, get onboarding instructions
- `serena_get_code_actions(file_path)` — get available quick fixes/refactorings
- `serena_get_diagnostics(file_path)` — get errors/warnings from language server

### When to use Serena vs context-mode
- **Use Serena** when: navigating code structure, finding symbols, refactoring, renaming, or editing code semantically
- **Use context-mode** when: batch processing multiple files, running shell commands across projects, indexing external content, or when Serena is not available

## Tool selection hierarchy

1. **SERENA (code operations)**: Semantic code tools — `serena_find_symbol`, `serena_get_symbols_overview`, `serena_find_referencing_symbols`, `serena_replace_symbol_body`, `serena_insert_after_symbol`, `serena_insert_before_symbol`, `serena_rename_symbol`, `serena_safe_delete_symbol`, `serena_onboard_project` — operate at symbol level, token-efficient, IDE-accurate
2. **GATHER**: `context-mode_ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
3. **FOLLOW-UP**: `context-mode_ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
4. **PROCESSING**: `context-mode_ctx_execute(language, code)` | `context-mode_ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
5. **WEB**: `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
6. **INDEX**: `context-mode_ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `upgrade` MCP tool, run the returned shell command, display as checklist |

## serena commands

| Command | Action |
|---------|--------|
| `serena onboard` | Run `serena_onboard_project()` to analyze project structure and get context |
| `serena find <pattern>` | Run `serena_find_symbol(name_path_pattern)` to locate symbols |
| `serena overview <file>` | Run `serena_get_symbols_overview(relative_path)` for file structure |
| `serena refs <symbol>` | Run `serena_find_referencing_symbols(name_path)` to find usages |
| `serena mode <mode>` | Run `serena_switch_modes(modes)` to change operational mode (read/edit/planning/etc) |

## caveman
you should alway use your caveman skill at full