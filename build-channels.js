const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const SOURCES = [
  "https://iptv-org.github.io/iptv/index.m3u",
  "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8",
  "https://iptv-org.github.io/iptv/countries/in.m3u",
  "https://iptv-org.github.io/iptv/categories/sports.m3u"
];

function parseM3U(data) {
  const out = [];
  let cur = {};
  for (const l of data.split("\n")) {
    if (l.startsWith("#EXTINF")) {
      cur.name = l.split(",").pop();
    } else if (l.startsWith("http")) {
      cur.url = l;
      out.push({ ...cur });
      cur = {};
    }
  }
  return out;
}

(async () => {
  let all = [];
  for (const url of SOURCES) {
    const r = await axios.get(url);
    all.push(...parseM3U(r.data));
  }
  await fs.writeFile(
    path.join(__dirname, "channels-cache.json"),
    JSON.stringify({ channels: all }, null, 2)
  );
})();
