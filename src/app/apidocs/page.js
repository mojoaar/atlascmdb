'use client';

import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, ChevronRight, ChevronDown, ExternalLink, Sun, Moon } from 'lucide-react';
import CodeBlock from '@/components/ui/CodeBlock';
import endpoints from './endpoints';
import styles from './page.module.css';

const LANG_TO_PRISM = { curl: 'bash', javascript: 'javascript', python: 'python' };

const CATEGORIES = [...new Set(endpoints.map(e => e.category))];

const METHOD_COLORS = {
  GET: 'var(--success)',
  POST: 'var(--info)',
  PATCH: 'var(--warning)',
  PUT: 'var(--warning)',
  DELETE: 'var(--danger)',
};

const LANGUAGES = [
  { key: 'curl', label: 'cURL' },
  { key: 'powershell', label: 'PowerShell' },
  { key: 'python', label: 'Python' },
  { key: 'javascript', label: 'JavaScript' },
];

function indentJSON(obj, spaces = 2) {
  return JSON.stringify(obj, null, spaces);
}

function escapeShell(str) {
  return str.replace(/'/g, "'\\''");
}

function generateCurl(endpoint, baseUrl) {
  const url = `${baseUrl}${endpoint.path}`;
  const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE' && endpoint.body;
  const lines = [];
  if (hasBody) {
    lines.push(`curl -X ${endpoint.method} \\`);
    lines.push(`  "${url}" \\`);
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -H "Authorization: Bearer $TOKEN" \\`);
    lines.push(`  -d '${escapeShell(indentJSON(endpoint.body))}'`);
  } else {
    lines.push(`curl -s "${url}" \\`);
    lines.push(`  -H "Authorization: Bearer $TOKEN"`);
  }
  return lines.join('\n');
}

function generatePowerShell(endpoint, baseUrl) {
  const url = `${baseUrl}${endpoint.path}`;
  const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE' && endpoint.body;
  const method = endpoint.method === 'DELETE' ? 'DELETE' : endpoint.method === 'PATCH' ? 'PATCH' : endpoint.method === 'PUT' ? 'PUT' : 'GET';
  const lines = [];
  if (hasBody) {
    const body = JSON.stringify(endpoint.body).replace(/"/g, '\\"');
    lines.push(`$body = '${body}'`);
    lines.push('');
    lines.push(`Invoke-RestMethod \\`);
    lines.push(`  -Uri "${url}" \\`);
    lines.push(`  -Method ${method} \\`);
    lines.push(`  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } \\`);
    lines.push(`  -Body $body`);
  } else if (method !== 'GET') {
    lines.push(`Invoke-RestMethod \\`);
    lines.push(`  -Uri "${url}" \\`);
    lines.push(`  -Method ${method} \\`);
    lines.push(`  -Headers @{ Authorization = "Bearer $token" }`);
  } else {
    lines.push(`Invoke-RestMethod \\`);
    lines.push(`  -Uri "${url}" \\`);
    lines.push(`  -Headers @{ Authorization = "Bearer $token" }`);
  }
  return lines.join('\n');
}

function generatePython(endpoint, baseUrl) {
  const url = `${baseUrl}${endpoint.path}`;
  const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE' && endpoint.body;
  if (hasBody) {
    const body = indentJSON(endpoint.body, 2).replace(/\n/g, '\n    ');
    return [
      `import requests`,
      ``,
      `headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}`,
      ``,
      `response = requests.${endpoint.method.toLowerCase()}("${url}", headers=headers, json=${indentJSON(endpoint.body)})`,
      `print(response.json())`,
    ].join('\n');
  }
  if (endpoint.method === 'DELETE') {
    return [
      `import requests`,
      ``,
      `headers = {"Authorization": f"Bearer {token}"}`,
      ``,
      `response = requests.delete("${url}", headers=headers)`,
      `print(response.json())`,
    ].join('\n');
  }
  return [
    `import requests`,
    ``,
    `headers = {"Authorization": f"Bearer {token}"}${endpoint.query ? `\nparams = ${indentJSON(endpoint.query)}` : ''}`,
    ``,
    `response = requests.get("${url}", headers=headers${endpoint.query ? ', params=params' : ''})`,
    `print(response.json())`,
  ].join('\n');
}

function generateJavaScript(endpoint, baseUrl) {
  const url = `${baseUrl}${endpoint.path}`;
  const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE' && endpoint.body;
  const method = endpoint.method === 'DELETE' ? 'DELETE' : endpoint.method === 'PATCH' ? 'PATCH' : endpoint.method === 'PUT' ? 'PUT' : 'GET';
  const lines = [];
  lines.push(`const token = process.env.ATLAS_TOKEN;`);
  lines.push('');
  if (hasBody) {
    lines.push(`const res = await fetch("${url}", {`);
    lines.push(`  method: "${method}",`);
    lines.push(`  headers: {`);
    lines.push(`    "Content-Type": "application/json",`);
    lines.push(`    "Authorization": \`Bearer \${token}\``);
    lines.push(`  },`);
    lines.push(`  body: JSON.stringify(${indentJSON(endpoint.body, 2).trim()})`);
    lines.push(`});`);
  } else if (method !== 'GET') {
    lines.push(`const res = await fetch("${url}", {`);
    lines.push(`  method: "${method}",`);
    lines.push(`  headers: { "Authorization": \`Bearer \${token}\` }`);
    lines.push(`});`);
  } else {
    lines.push(`const res = await fetch("${url}", {`);
    lines.push(`  headers: { "Authorization": \`Bearer \${token}\` }`);
    lines.push(`});`);
  }
  lines.push(`const data = await res.json();`);
  return lines.join('\n');
}

const GENERATORS = {
  curl: generateCurl,
  powershell: generatePowerShell,
  python: generatePython,
  javascript: generateJavaScript,
};

export default function DocsPage() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeEndpoint, setActiveEndpoint] = useState(null);
  const [activeLang, setActiveLang] = useState('curl');
  const [copiedKey, setCopiedKey] = useState(null);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current);
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setTheme(next);
  }

  const categories = useMemo(() => {
    return CATEGORIES.map(cat => ({
      name: cat,
      endpoints: endpoints.filter(e => e.category === cat),
    }));
  }, []);

  function selectEndpoint(ep) {
    setActiveEndpoint(ep);
  }

  function toggleCategory(cat) {
    setActiveCategory(activeCategory === cat ? null : cat);
  }

  async function copyCode(code) {
    await navigator.clipboard.writeText(code);
    setCopiedKey('code');
    setTimeout(() => setCopiedKey(null), 1500);
  }

  async function copyResponse() {
    await navigator.clipboard.writeText(indentJSON(activeEndpoint.response));
    setCopiedKey('response');
    setTimeout(() => setCopiedKey(null), 1500);
  }

  const code = activeEndpoint ? GENERATORS[activeLang](activeEndpoint, baseUrl) : '';

  return (
    <div className={styles.explorer}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.headerRow}>
            <h2 className={styles.sidebarTitle}>API Reference</h2>
            <button className={styles.themeToggle} onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <div className={styles.baseUrlWrapper}>
            <label className={styles.baseUrlLabel}>Base URL</label>
            <input
              className={styles.baseUrlInput}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
          </div>
        </div>
        <div className={styles.sidebarNav}>
          {categories.map(cat => (
            <div key={cat.name} className={styles.categoryGroup}>
              <button
                className={styles.categoryButton}
                onClick={() => toggleCategory(cat.name)}
              >
                {activeCategory === cat.name ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>{cat.name}</span>
                <span className={styles.categoryCount}>{cat.endpoints.length}</span>
              </button>
              {activeCategory === cat.name && (
                <div className={styles.endpointList}>
                  {cat.endpoints.map((ep, i) => (
                    <button
                      key={i}
                      className={`${styles.endpointItem} ${activeEndpoint === ep ? styles.endpointItemActive : ''}`}
                      onClick={() => selectEndpoint(ep)}
                    >
                      <span className={styles.methodTag} style={{ color: METHOD_COLORS[ep.method] }}>
                        {ep.method}
                      </span>
                      <span className={styles.endpointPath}>{ep.path}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.main}>
        {!activeEndpoint ? (
          <div className={styles.placeholder}>
            <h3>REST API Explorer</h3>
            <p>Select an endpoint from the sidebar to see details and code examples.</p>
            <p className={styles.placeholderHint}>
              All authenticated endpoints accept either a <code>Bearer</code> token in the <code>Authorization</code> header
              or the <code>atlas_access</code> httpOnly cookie set by <code>POST /api/auth/login</code>.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.endpointHeader}>
              <div className={styles.endpointTitleRow}>
                <span className={styles.methodBadge} style={{ background: METHOD_COLORS[activeEndpoint.method] }}>
                  {activeEndpoint.method}
                </span>
                <h2 className={styles.endpointTitle}>{activeEndpoint.path}</h2>
              </div>
              <p className={styles.endpointDesc}>{activeEndpoint.description}</p>
              <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                  Auth: <strong>{activeEndpoint.auth === 'None' ? 'None' : activeEndpoint.auth}</strong>
                </span>
                <a
                  href={`${baseUrl}${activeEndpoint.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.tryLink}
                >
                  <ExternalLink size={14} /> Try it
                </a>
              </div>
            </div>

            {activeEndpoint.query && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Query Parameters</h3>
                <pre className={styles.codeBlock}>{indentJSON(activeEndpoint.query, 2)}</pre>
              </div>
            )}

            {activeEndpoint.body && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Request Body</h3>
                <div className={styles.codeBlockWrapper}>
                  <button className={styles.copyBtn} onClick={() => { navigator.clipboard.writeText(indentJSON(activeEndpoint.body, 2)); setCopiedKey('body'); setTimeout(() => setCopiedKey(null), 1500); }}>
                    {copiedKey === 'body' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                  <pre className={styles.codeBlock}>{indentJSON(activeEndpoint.body, 2)}</pre>
                </div>
              </div>
            )}

            <div className={styles.section}>
              <div className={styles.sectionTitleRow}>
                <h3 className={styles.sectionTitle}>Response</h3>
                <button className={styles.copyBtn} onClick={copyResponse}>
                  {copiedKey === 'response' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
              <pre className={styles.codeBlock}>{indentJSON(activeEndpoint.response, 2)}</pre>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Code Examples</h3>
              <div className={styles.langTabs}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.key}
                    className={`${styles.langTab} ${activeLang === lang.key ? styles.langTabActive : ''}`}
                    onClick={() => setActiveLang(lang.key)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <CodeBlock language={LANG_TO_PRISM[activeLang] || activeLang}>{code}</CodeBlock>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
