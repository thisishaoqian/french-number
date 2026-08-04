/*
 * numbers-fr.js
 * Convert an integer (0-9999) to French words, for France ('fr') and
 * Switzerland ('ch') variants, plus a normalizer used for grading typed answers.
 *
 * Swiss variant differences (70-99 only):
 *   70 septante   80 huitante   90 nonante
 * with "et" appearing only at 71 / 81 / 91 (septante-et-un, huitante-et-un, nonante-et-un).
 *
 * Works as a browser global (window.FrenchNumbers) and as a Node module.
 */
(function (global) {
  'use strict';

  // 0-19 have unique words; also used for the "teens" inside 70/90 in France mode.
  var UNITS = [
    'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
    'dix-sept', 'dix-huit', 'dix-neuf'
  ];

  var TENS = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };

  // 0-99
  function twoDigits(n, swiss) {
    if (n < 20) return UNITS[n];
    var tens = Math.floor(n / 10);
    var u = n % 10;

    if (tens >= 2 && tens <= 6) {
      var base = TENS[tens];
      if (u === 0) return base;
      if (u === 1) return base + '-et-un';
      return base + '-' + UNITS[u];
    }

    if (tens === 7) {
      if (swiss) {
        if (u === 0) return 'septante';
        if (u === 1) return 'septante-et-un';
        return 'septante-' + UNITS[u];
      }
      // France: soixante + (10..19)
      if (u === 0) return 'soixante-dix';
      if (u === 1) return 'soixante-et-onze';
      return 'soixante-' + UNITS[10 + u];
    }

    if (tens === 8) {
      if (swiss) {
        if (u === 0) return 'huitante';
        if (u === 1) return 'huitante-et-un';
        return 'huitante-' + UNITS[u];
      }
      // France: quatre-vingts (keeps 's' only when standing alone), no "et" at 81
      if (u === 0) return 'quatre-vingts';
      return 'quatre-vingt-' + UNITS[u];
    }

    // tens === 9
    if (swiss) {
      if (u === 0) return 'nonante';
      if (u === 1) return 'nonante-et-un';
      return 'nonante-' + UNITS[u];
    }
    // France: quatre-vingt + (10..19), no "et" at 91
    if (u === 0) return 'quatre-vingt-dix';
    if (u === 1) return 'quatre-vingt-onze';
    return 'quatre-vingt-' + UNITS[10 + u];
  }

  // 0-999
  function hundreds(n, swiss) {
    if (n < 100) return twoDigits(n, swiss);
    var h = Math.floor(n / 100);
    var rest = n % 100;
    var word = h === 1 ? 'cent' : UNITS[h] + ' cent';
    if (rest === 0) return h > 1 ? word + 's' : word; // "cents" only when nothing follows
    return word + ' ' + twoDigits(rest, swiss);
  }

  // 0-9999
  function thousands(n, swiss) {
    if (n < 1000) return hundreds(n, swiss);
    var th = Math.floor(n / 1000);
    var rest = n % 1000;
    var word = th === 1 ? 'mille' : UNITS[th] + ' mille'; // "mille" is invariable
    if (rest === 0) return word;
    return word + ' ' + hundreds(rest, swiss);
  }

  function numberToFrench(n, variant) {
    n = Math.floor(Number(n));
    if (!isFinite(n) || n < 0) return '';
    if (n === 0) return 'zéro';
    return thousands(n, variant === 'ch');
  }

  // Normalize a French number phrase for lenient comparison:
  // lowercase, strip accents, collapse hyphens/spaces, trim.
  // Makes "Quatre-Vingt-Un", "quatre vingt un" and "quatre-vingt-un" all equal.
  function normalizeFrench(s) {
    return String(s)
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[-\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  var api = {
    numberToFrench: numberToFrench,
    normalizeFrench: normalizeFrench
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.FrenchNumbers = api;
})(typeof window !== 'undefined' ? window : globalThis);
