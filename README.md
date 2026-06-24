# miller-center
Updated site for Miller Center.


## Partners page data

`partners.html` now builds its left navigation from `data/partners-index.json`.
Each organization has a separate folder in `data/organizations/<organization-id>/` with:

- `organization.json` — name, contact/info HTML, description HTML, category metadata;
- `logo.*` — logo copied from the old site archive when available.

The JavaScript file `partners.js` loads the index first, then lazy-loads only the selected organization's JSON file. It caches already opened organizations in memory.

Because `partners.js` uses `fetch()`, open the project through a local HTTP server, not by double-clicking `partners.html`:

```bash
conda run -n base python -m http.server 8000
```

Then open `http://localhost:8000/partners.html`.
