// Render the small subset of markdown used by wall posts. User text is never HTML.
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(value) {
  const href = value.trim();
  if (!href) return null;
  try {
    const url = new URL(href, "https://chalk.invalid");
    return url.protocol === "http:" || url.protocol === "https:" ? href : null;
  } catch {
    return null;
  }
}

function renderInline(source) {
  const pattern = /`([^`\n]+)`|\[([^\]\n]+)\]\(([^)\n]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let html = "";
  let cursor = 0;

  for (const match of source.matchAll(pattern)) {
    html += escapeHtml(source.slice(cursor, match.index));
    if (match[1] !== undefined) {
      html += `<code>${escapeHtml(match[1])}</code>`;
    } else if (match[2] !== undefined) {
      const href = safeHref(match[3]);
      html += href
        ? `<a href="${escapeHtml(href)}">${escapeHtml(match[2])}</a>`
        : escapeHtml(match[0]);
    } else if (match[4] !== undefined) {
      html += `<strong>${escapeHtml(match[4])}</strong>`;
    } else {
      html += `<em>${escapeHtml(match[5])}</em>`;
    }
    cursor = match.index + match[0].length;
  }

  return html + escapeHtml(source.slice(cursor));
}

function renderMarkdown(src) {
  const lines = String(src ?? "").replace(/\r\n?/g, "\n").split("\n");
  let html = "";
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listItem = /^[-*] (.+)$/.exec(line);
    if (listItem) {
      if (!inList) html += "<ul>";
      html += `<li>${renderInline(listItem[1])}</li>`;
      inList = true;
      continue;
    }
    if (inList) {
      html += "</ul>";
      inList = false;
    }
    if (i > 0) html += "<br>";
    const heading = /^(#{1,3}) (.+)$/.exec(line);
    html += heading
      ? `<h${heading[1].length}>${renderInline(heading[2])}</h${heading[1].length}>`
      : renderInline(line);
  }
  if (inList) html += "</ul>";
  return html;
}

module.exports = { renderMarkdown };
