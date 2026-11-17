// Rodar: npm test  (node:test via tsx)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isBotUserAgent, isTrackedPath } from './visits';

test('só os quatro caminhos públicos são contados', () => {
  for (const p of ['/', '/register', '/login', '/privacidade']) assert.equal(isTrackedPath(p), true);
  for (const p of ['/admin', '/dashboard', '/register/', '', '/Login', null, undefined, 42, {}]) {
    assert.equal(isTrackedPath(p), false);
  }
});

test('robôs, prévias e user-agent vazio são ignorados', () => {
  const bots = [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0)',
    'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0',
    'Slackbot-LinkExpanding 1.0',
    'WhatsApp/2.23.20 A',
    'facebookexternalhit/1.1',
    'curl/8.4.0',
    'Mozilla/5.0 (compatible; AhrefsSpider)',
    'Mozilla/5.0 Chrome-Lighthouse',
  ];
  for (const ua of bots) assert.equal(isBotUserAgent(ua), true, ua);
  assert.equal(isBotUserAgent(''), true);
  assert.equal(isBotUserAgent(null), true);
  assert.equal(isBotUserAgent(undefined), true);
});

test('navegadores comuns são contados', () => {
  const humans = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];
  for (const ua of humans) assert.equal(isBotUserAgent(ua), false, ua);
});
