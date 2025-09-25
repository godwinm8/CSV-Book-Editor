const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Sci-Fi",
  "Fantasy",
  "Mystery",
  "Biography",
  "Self-Help",
  "History",
  "Romance",
  "Horror",
];

const ri = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (a) => a[ri(0, a.length - 1)];
const word = (len) => {
  const s = "abcdefghijklmnopqrstuvwxyz";
  let o = "";
  for (let i = 0; i < len; i++) o += s[ri(0, s.length - 1)];
  return o;
};
const title = () =>
  Array.from({ length: ri(2, 5) }, () => {
    const w = word(ri(3, 8));
    return w[0].toUpperCase() + w.slice(1);
  }).join(" ");
const author = () => {
  const f = word(ri(3, 7)),
    l = word(ri(5, 10));
  return `${f[0].toUpperCase() + f.slice(1)} ${
    l[0].toUpperCase() + l.slice(1)
  }`;
};
const isbn = () => Array.from({ length: 13 }, () => ri(0, 9)).join("");

export function generateBooks(n = 10000) {
  const arr = new Array(n);
  for (let i = 0; i < n; i++) {
    arr[i] = {
      Title: title(),
      Author: author(),
      Genre: pick(GENRES),
      PublishedYear: String(ri(1950, 2025)),
      ISBN: isbn(),
    };
  }
  return arr;
}
