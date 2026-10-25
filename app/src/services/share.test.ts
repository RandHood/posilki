import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('__PREVIEW__', false);
vi.stubGlobal('location', { href: 'https://randhood.github.io/posilki/' });
const { readRecipeLink, recipeLink } = await import('./share');

describe('recipe share links', () => {
  it('round-trips a recipe with Polish letters', () => {
    const link = recipeLink({ id: 'r1', name: 'Żurek łatwy', desc: 'Pyszny', types: [], mins: 0, ing: [['piers', 150], ['ryz', 70]], steps: ['Gotuj'], video: '' });
    expect(link.startsWith('https://randhood.github.io/posilki/#recipe=')).toBe(true);
    expect(readRecipeLink(link)).toEqual({ name: 'Żurek łatwy', desc: 'Pyszny', ing: [['piers', 150], ['ryz', 70]], steps: ['Gotuj'], video: '' });
  });
  it('reads a link made by 0.17.x', () => {
    // Made with the 0.17 code: btoa(unescape(encodeURIComponent(JSON))) with URL-safe characters.
    const json = JSON.stringify({ n: 'Test bowl', d: '', i: [['ryz', 100]], s: ['Cook rice'], v: '' });
    const b = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(readRecipeLink('#recipe=' + b)?.name).toBe('Test bowl');
  });
  it('drops unknown ingredients and rejects junk', () => {
    const b = btoa(JSON.stringify({ n: 'X', i: [['nope', 5], ['ryz', 9999]] }));
    expect(readRecipeLink('#recipe=' + b)?.ing).toEqual([['ryz', 5000]]);
    expect(readRecipeLink('#recipe=@@@')).toBeNull();
    expect(readRecipeLink('no link here')).toBeNull();
  });
});
