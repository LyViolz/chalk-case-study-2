const assert = require("node:assert/strict");
const test = require("node:test");
const { renderMarkdown } = require("./markdown");

test("renders supported wall formatting", () => {
  const html = renderMarkdown("## Shop **hours**\n*Tonight* `7–10` [map](/shop)\n- bring goggles");
  assert.match(html, /<h2>Shop <strong>hours<\/strong><\/h2>/);
  assert.match(html, /<em>Tonight<\/em> <code>7–10<\/code> <a href="\/shop">map<\/a>/);
  assert.match(html, /<ul><li>bring goggles<\/li><\/ul>/);
});

test("escapes HTML instead of running it", () => {
  const html = renderMarkdown('<img src=x onerror=document.title=1> **<svg onload=alert(1)>**');
  assert.doesNotMatch(html, /<img|<svg/);
  assert.match(html, /&lt;img src=x onerror=document\.title=1&gt;/);
  assert.match(html, /<strong>&lt;svg onload=alert\(1\)&gt;<\/strong>/);
});

test("rejects executable links and escapes link attributes", () => {
  assert.equal(renderMarkdown("[click](javascript:alert(1))"), "[click](javascript:alert(1))");
  assert.equal(renderMarkdown('[safe](https://example.edu/?q="x")'),
    '<a href="https://example.edu/?q=&quot;x&quot;">safe</a>');
});
