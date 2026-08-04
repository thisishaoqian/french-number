// Node self-tests for numbers-fr.js — run: node test-numbers.js
var { numberToFrench, normalizeFrench } = require('./numbers-fr.js');

var cases = [
  // [n, variant, expected]
  [0, 'fr', 'zéro'],
  [1, 'fr', 'un'],
  [16, 'fr', 'seize'],
  [17, 'fr', 'dix-sept'],
  [20, 'fr', 'vingt'],
  [21, 'fr', 'vingt-et-un'],
  [22, 'fr', 'vingt-deux'],
  [60, 'fr', 'soixante'],
  [61, 'fr', 'soixante-et-un'],
  [70, 'fr', 'soixante-dix'],
  [71, 'fr', 'soixante-et-onze'],
  [76, 'fr', 'soixante-seize'],
  [77, 'fr', 'soixante-dix-sept'],
  [79, 'fr', 'soixante-dix-neuf'],
  [80, 'fr', 'quatre-vingts'],
  [81, 'fr', 'quatre-vingt-un'],
  [88, 'fr', 'quatre-vingt-huit'],
  [90, 'fr', 'quatre-vingt-dix'],
  [91, 'fr', 'quatre-vingt-onze'],
  [99, 'fr', 'quatre-vingt-dix-neuf'],
  [100, 'fr', 'cent'],
  [101, 'fr', 'cent un'],
  [180, 'fr', 'cent quatre-vingts'],
  [200, 'fr', 'deux cents'],
  [201, 'fr', 'deux cent un'],
  [280, 'fr', 'deux cent quatre-vingts'],
  [1000, 'fr', 'mille'],
  [1234, 'fr', 'mille deux cent trente-quatre'],
  [2000, 'fr', 'deux mille'],
  [9999, 'fr', 'neuf mille neuf cent quatre-vingt-dix-neuf'],

  // Swiss
  [70, 'ch', 'septante'],
  [71, 'ch', 'septante-et-un'],
  [77, 'ch', 'septante-sept'],
  [80, 'ch', 'huitante'],
  [81, 'ch', 'huitante-et-un'],
  [88, 'ch', 'huitante-huit'],
  [90, 'ch', 'nonante'],
  [91, 'ch', 'nonante-et-un'],
  [99, 'ch', 'nonante-neuf'],
  [280, 'ch', 'deux cent huitante'],
  [1794, 'ch', 'mille sept cent nonante-quatre'],
  [9999, 'ch', 'neuf mille neuf cent nonante-neuf'],
];

var fail = 0;
cases.forEach(function (c) {
  var got = numberToFrench(c[0], c[1]);
  var ok = got === c[2];
  if (!ok) { fail++; console.log('FAIL', c[0], c[1], '=> got "' + got + '" expected "' + c[2] + '"'); }
});

// Normalizer checks
var norm = [
  ['Quatre-Vingt-Un', 'quatre vingt un'],
  ['vingt-et-un', 'vingt et un'],
  ['SEPTANTE-DEUX', 'septante deux'],
  ['zéro', 'zero'],
];
norm.forEach(function (p) {
  if (normalizeFrench(p[0]) !== p[1]) { fail++; console.log('NORM FAIL', p[0], '=>', normalizeFrench(p[0]), 'expected', p[1]); }
});
// Two equivalent spellings should match after normalization
if (normalizeFrench('quatre-vingt-un') !== normalizeFrench('Quatre vingt un')) { fail++; console.log('NORM EQ FAIL'); }

console.log(fail === 0 ? ('ALL ' + (cases.length + norm.length + 1) + ' CHECKS PASSED') : (fail + ' CHECK(S) FAILED'));
process.exit(fail === 0 ? 0 : 1);
