#!/usr/bin/env node
/**
 * Builds the app seed from the anime-offline-database release.
 *
 * Usage:
 *   node scripts/build-seed.mjs --source /tmp/anime-offline-database.json
 *
 * The source file is ODbL-1.0. We keep only the fields needed by Nimelist and
 * do not redistribute the full upstream database.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const sourceArg = args.find((arg) => arg.startsWith("--source="));
const sourcePath =
  sourceArg?.split("=")[1] ??
  (args.includes("--source") ? args[args.indexOf("--source") + 1] : undefined) ??
  "/tmp/anime-offline-database.json";
const outputPath = path.join(root, "data", "seed.json");

if (!fs.existsSync(sourcePath)) {
  console.error(`Source database not found: ${sourcePath}`);
  console.error("Download it from https://github.com/manami-project/anime-offline-database/releases");
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const GENRES = [
  { slug: "aksi", name: "Aksi", nameId: "Aksi", description: "Pertarungan, kejar-kejaran, dan konflik fisik." },
  { slug: "petualangan", name: "Petualangan", nameId: "Petualangan", description: "Perjalanan ke dunia baru, misi, dan eksplorasi." },
  { slug: "komedi", name: "Komedi", nameId: "Komedi", description: "Humor, situasi konyol, dan komedi karakter." },
  { slug: "drama", name: "Drama", nameId: "Drama", description: "Konflik emosional dan perkembangan karakter." },
  { slug: "fantasi", name: "Fantasi", nameId: "Fantasi", description: "Dunia imajinatif, sihir, dan makhluk mitologis." },
  { slug: "romansa", name: "Romansa", nameId: "Romansa", description: "Hubungan romantis dan dinamika perasaan." },
  { slug: "sci-fi", name: "Sci-Fi", nameId: "Sci-Fi", description: "Teknologi, luar angkasa, dan masa depan." },
  { slug: "slice-of-life", name: "Slice of Life", nameId: "Slice of Life", description: "Kehidupan sehari-hari yang tenang dan hangat." },
  { slug: "misteri", name: "Misteri", nameId: "Misteri", description: "Teka-teki, investigasi, dan rahasia." },
  { slug: "olahraga", name: "Olahraga", nameId: "Olahraga", description: "Kompetisi, latihan, dan semangat tim." },
  { slug: "supernatural", name: "Supernatural", nameId: "Supernatural", description: "Hantu, roh, kekuatan gaib, dan fenomena aneh." },
  { slug: "musik", name: "Musik", nameId: "Musik", description: "Band, idola, dan perjalanan kreatif." },
  { slug: "horor", name: "Horor", nameId: "Horor", description: "Ketegangan, teror, dan atmosfer gelap." },
  { slug: "thriller", name: "Thriller", nameId: "Thriller", description: "Ketegangan, konspirasi, dan taruhan tinggi." },
  { slug: "psikologis", name: "Psikologis", nameId: "Psikologis", description: "Pergulatan batin dan permainan pikiran." },
  { slug: "mecha", name: "Mecha", nameId: "Mecha", description: "Robot raksasa dan pertarungan teknologi." },
  { slug: "isekai", name: "Isekai", nameId: "Isekai", description: "Dunia lain, reinkarnasi, dan petualangan baru." },
  { slug: "sekolah", name: "Sekolah", nameId: "Sekolah", description: "Kehidupan sekolah dan dinamika remaja." },
  { slug: "sejarah", name: "Sejarah", nameId: "Sejarah", description: "Latar masa lalu dan peristiwa historis." },
  { slug: "lainnya", name: "Lainnya", nameId: "Lainnya", description: "Judul yang belum memiliki genre utama." },
];

const GENRE_RULES = [
  ["aksi", ["action", "action comedy", "action drama", "martial arts", "fighting-shounen", "combat sport", "swordplay", "guns", "military", "super power"]],
  ["petualangan", ["adventure", "journey", "pirate", "pirates", "exploration", "travel"]],
  ["komedi", ["comedy", "gag humor", "parody", "romantic comedy", "sitcom", "slapstick"]],
  ["drama", ["drama", "melodrama", "coming of age", "coming-of-age", "tragedy"]],
  ["fantasi", ["fantasy", "alternative world", "magic", "demon", "demons", "dragons", "elves", "deity", "mythology", "fairy tale"]],
  ["romansa", ["romance", "heterosexual", "mature romance", "love triangle", "romantic"]],
  ["sci-fi", ["sci fi", "science fiction", "space", "cyberpunk", "mecha", "androids", "time travel", "aliens"]],
  ["slice-of-life", ["slice of life", "iyashikei", "cute girls doing cute things", "cgdct", "daily life"]],
  ["misteri", ["mystery", "detective", "detectives", "crime fiction", "investigation", "rakugo"]],
  ["olahraga", ["sports", "football", "soccer", "baseball", "basketball", "volleyball", "badminton", "tennis", "boxing", "swimming", "cycling"]],
  ["supernatural", ["supernatural", "ghost", "ghosts", "youkai", "psi-powers", "psychic", "demons", "god", "gods", "spirits"]],
  ["musik", ["music", "band", "idol", "idols", "singing"]],
  ["horor", ["horror", "gore", "splatter & gore", "zombie", "apocalypse", "apocalyptic fiction", "excessive violence"]],
  ["thriller", ["thriller", "suspense", "conspiracy", "assassins", "crime", "organized crime", "gambling", "high stakes game", "military"]],
  ["psikologis", ["psychological", "mind games", "brain games and gambling", "depression", "disability", "illness"]],
  ["mecha", ["mecha", "robot", "full cgi", "cgi"]],
  ["isekai", ["alternative world", "reincarnation", "transported to another world", "isekai"]],
  ["sekolah", ["school", "high school", "school club", "academy", "college", "university"]],
  ["sejarah", ["historical", "ancient china", "samurai", "edo period", "world war ii", "china"]],
];

const PLATFORMS = [
  {
    slug: "bstation",
    name: "Bstation",
    websiteUrl: "https://www.bstation.tv",
    searchUrlTemplate: "https://www.bstation.tv/search?keyword={q}",
    color: "#22A7F0",
    description: "Platform streaming dengan banyak anime simulcast dan subtitle Indonesia.",
    sortOrder: 1,
  },
  {
    slug: "crunchyroll",
    name: "Crunchyroll",
    websiteUrl: "https://www.crunchyroll.com",
    searchUrlTemplate: "https://www.crunchyroll.com/search?q={q}",
    color: "#F47521",
    description: "Layanan anime internasional dengan simulcast dan pustaka besar.",
    sortOrder: 2,
  },
  {
    slug: "netflix",
    name: "Netflix",
    websiteUrl: "https://www.netflix.com/id",
    searchUrlTemplate: "https://www.netflix.com/search?q={q}",
    color: "#E50914",
    description: "Film dan serial anime dalam katalog Netflix Indonesia.",
    sortOrder: 3,
  },
  {
    slug: "iqiyi",
    name: "iQIYI",
    websiteUrl: "https://www.iq.com",
    searchUrlTemplate: "https://www.iq.com/search?query={q}",
    color: "#00BE06",
    description: "Platform dengan anime, drama Asia, dan subtitle Indonesia.",
    sortOrder: 4,
  },
  {
    slug: "vidio",
    name: "Vidio",
    websiteUrl: "https://www.vidio.com",
    searchUrlTemplate: "https://www.vidio.com/search?q={q}",
    color: "#E62129",
    description: "Layanan streaming Indonesia dengan pilihan anime dan film.",
    sortOrder: 5,
  },
  {
    slug: "prime-video",
    name: "Prime Video",
    websiteUrl: "https://www.primevideo.com",
    searchUrlTemplate: "https://www.primevideo.com/search?phrase={q}",
    color: "#00A8E1",
    description: "Katalog anime dan film melalui Amazon Prime Video.",
    sortOrder: 6,
  },
  {
    slug: "disney-plus-hotstar",
    name: "Disney+ Hotstar",
    websiteUrl: "https://www.hotstar.com/id",
    searchUrlTemplate: "https://www.hotstar.com/id/search?q={q}",
    color: "#1F80E0",
    description: "Anime dan konten keluarga melalui Disney+ Hotstar.",
    sortOrder: 7,
  },
];

/**
 * Curated titles get an original Indonesian synopsis and a reviewed status.
 * The synopsis is written by us, not translated from a provider.
 */
const CURATED = [
  {
    match: /^Sousou no Frieren$/,
    format: "TV",
    slug: "sousou-no-frieren",
    displayTitle: "Frieren: Beyond Journey's End",
    synopsis:
      "Setelah rombongan pahlawan mengalahkan Raja Iblis, penyihir elf Frieren hidup jauh lebih lama daripada rekan-rekannya. Perjalanan barunya menjadi cara untuk memahami waktu, kehilangan, dan arti ikatan yang ia lewati.",
  },
  {
    match: /^Jujutsu Kaisen$/,
    format: "TV",
    slug: "jujutsu-kaisen",
    displayTitle: "Jujutsu Kaisen",
    synopsis:
      "Yuji Itadori menelan jari terkutuk dan menjadi wadah Sukuna, roh kutukan paling berbahaya. Ia bergabung dengan sekolah jujutsu untuk melindungi orang lain sambil mencari cara menghapus kutukan itu.",
  },
  {
    match: /^Kimetsu no Yaiba$/,
    format: "TV",
    slug: "demon-slayer-kimetsu-no-yaiba",
    displayTitle: "Demon Slayer: Kimetsu no Yaiba",
    synopsis:
      "Tanjiro Kamado kehilangan keluarganya dan menyaksikan adiknya berubah menjadi iblis. Ia menjadi pembasmi iblis untuk mencari obat bagi adiknya dan membalas keluarganya.",
  },
  {
    match: /^Spy x Family$/,
    format: "TV",
    slug: "spy-x-family",
    displayTitle: "Spy x Family",
    synopsis:
      "Seorang mata-mata, seorang pembunuh, dan seorang anak telepati membentuk keluarga palsu demi misi. Kehidupan sehari-hari mereka berkembang menjadi ikatan yang lebih nyata daripada yang direncanakan.",
  },
  {
    match: /^One Piece$/,
    format: "TV",
    slug: "one-piece",
    displayTitle: "One Piece",
    synopsis:
      "Luffy dan kru Bajak Laut Topi Jerami berlayar mencari One Piece, harta karun legendaris yang akan menjadikannya Raja Bajak Laut. Sepanjang perjalanan, mereka menghadapi organisasi kriminal, angkatan laut, dan rahasia dunia.",
  },
  {
    match: /^Shingeki no Kyojin$/,
    format: "TV",
    slug: "attack-on-titan",
    displayTitle: "Attack on Titan",
    synopsis:
      "Umat manusia bertahan di balik tembok raksasa dari ancaman Titan. Eren Yeager bergabung dengan militer setelah tembok keluarganya runtuh, lalu menemukan bahwa kebenaran di balik Titan jauh lebih rumit.",
  },
  {
    match: /^Chainsaw Man$/,
    format: "TV",
    slug: "chainsaw-man",
    displayTitle: "Chainsaw Man",
    synopsis:
      "Denji adalah pemuda miskin yang hidup sebagai pemburu iblis bersama Chainsaw Devil. Setelah pengkhianatan, ia bangkit sebagai Chainsaw Man dan masuk ke organisasi pemburu iblis pemerintah.",
  },
  {
    match: /^Bocchi the Rock!$/,
    format: "TV",
    slug: "bocchi-the-rock",
    displayTitle: "Bocchi the Rock!",
    synopsis:
      "Hitori Gotoh, gadis introvert yang belajar gitar sendirian, bergabung dengan band Kessoku Band. Cerita mengikuti langkah kecilnya untuk tampil di depan orang dan menemukan teman.",
  },
  {
    match: /^\[Oshi no Ko\]$/,
    format: "TV",
    slug: "oshi-no-ko",
    displayTitle: "Oshi no Ko",
    synopsis:
      "Seorang dokter dan pasiennya terlahir kembali sebagai anak kembar dari idola terkenal. Mereka tumbuh di dunia hiburan Jepang yang penuh tekanan, ambisi, dan rahasia.",
  },
  {
    match: /^Fullmetal Alchemist: Brotherhood$/,
    format: "TV",
    slug: "fullmetal-alchemist-brotherhood",
    displayTitle: "Fullmetal Alchemist: Brotherhood",
    synopsis:
      "Dua bersaudara melakukan ritual terlarang dan membayar harga mahal. Mereka mencari Philosopher's Stone untuk memulihkan tubuh sambil menghadapi konspirasi militer dan rahasia negara.",
  },
  {
    match: /^Steins;Gate$/,
    format: "TV",
    slug: "steins-gate",
    displayTitle: "Steins;Gate",
    synopsis:
      "Seorang ilmuwan amatir menemukan cara mengirim pesan ke masa lalu. Setiap perubahan kecil membawa konsekuensi besar, dan ia harus berjuang memilih masa depan yang ingin diselamatkan.",
  },
  {
    match: /^Cowboy Bebop$/,
    format: "TV",
    slug: "cowboy-bebop",
    displayTitle: "Cowboy Bebop",
    synopsis:
      "Sekelompok pemburu hadiah berkeliling tata surya dengan masa lalu masing-masing. Jazz, melankoli, dan aksi menjadi latar perjalanan mereka.",
  },
  {
    match: /^Violet Evergarden$/,
    format: "TV",
    slug: "violet-evergarden",
    displayTitle: "Violet Evergarden",
    synopsis:
      "Seorang mantan tentara bekerja sebagai penulis surat otomatis untuk memahami perasaan manusia. Setiap surat membantunya memproses masa lalu dan mencari arti kata cinta.",
  },
  {
    match: /^Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen$/,
    format: "TV",
    slug: "kaguya-sama-love-is-war",
    displayTitle: "Kaguya-sama: Love Is War",
    synopsis:
      "Dua siswa terbaik di sekolah elit saling menyukai tetapi terlalu gengsi untuk mengaku. Mereka menjadikan pengakuan perasaan sebagai duel strategi.",
  },
  {
    match: /^Haikyuu!!$/,
    format: "TV",
    slug: "haikyuu",
    displayTitle: "Haikyuu!!",
    synopsis:
      "Hinata ingin menjadi pemain voli hebat meski tubuhnya kecil. Ia bergabung dengan tim SMA Karasuno dan bekerja sama dengan setter berbakat untuk kembali bersaing di tingkat nasional.",
  },
  {
    match: /^Kimi no Na wa\.$/,
    format: "MOVIE",
    slug: "your-name",
    displayTitle: "Your Name.",
    synopsis:
      "Dua remaja yang tidak saling kenal tiba-tiba bertukar tubuh. Mereka mencari satu sama lain sambil menghadapi bencana yang menghubungkan waktu dan tempat.",
  },
  {
    match: /^Suzume no Tojimari$/,
    format: "MOVIE",
    slug: "suzume",
    displayTitle: "Suzume",
    synopsis:
      "Seorang gadis membuka pintu misterius dan bertemu pemuda yang menjaga gerbang bencana. Perjalanan mereka menyatukan luka masa lalu dan harapan untuk masa depan.",
  },
  {
    match: /^Dandadan$/,
    format: "TV",
    slug: "dandadan",
    displayTitle: "Dandadan",
    synopsis:
      "Dua siswa dengan minat berbeda—satu pada hantu, satu pada alien—terlibat dalam pertarungan supranatural. Cerita berpadu komedi, aksi, dan romansa.",
  },
  {
    match: /^Ore dake Level Up na Ken$/,
    format: "TV",
    slug: "solo-leveling",
    displayTitle: "Solo Leveling",
    synopsis:
      "Seorang pemburu terlemah mendapat sistem misterius yang memungkinkannya naik level tanpa batas. Ia tumbuh dari underdog menjadi kekuatan yang mengubah dunia.",
  },
  {
    match: /^Kusuriya no Hitorigoto$/,
    format: "TV",
    slug: "the-apothecary-diaries",
    displayTitle: "The Apothecary Diaries",
    synopsis:
      "Maomao, apoteker muda di istana kekaisaran, memecahkan misteri medis dan intrik politik. Kecerdasannya menarik perhatian pejabat tinggi.",
  },
  {
    match: /^Blue Lock$/,
    format: "TV",
    slug: "blue-lock",
    displayTitle: "Blue Lock",
    synopsis:
      "Program pelatihan ekstrem mengumpulkan penyerang muda untuk menciptakan striker terbaik Jepang. Kerja sama dan ego bertabrakan dalam kompetisi tanpa ampun.",
  },
  {
    match: /^Mob Psycho 100$/,
    format: "TV",
    slug: "mob-psycho-100",
    displayTitle: "Mob Psycho 100",
    synopsis:
      "Mob adalah siswa biasa dengan kekuatan psikis luar biasa. Ia belajar mengendalikan emosi dan memahami bahwa kekuatan bukan segalanya.",
  },
  {
    match: /^Vinland Saga$/,
    format: "TV",
    slug: "vinland-saga",
    displayTitle: "Vinland Saga",
    synopsis:
      "Thorfinn tumbuh dengan dendam terhadap pembunuh ayahnya. Perjalanan Viking membawanya pada pertanyaan tentang kekerasan, kebebasan, dan arti hidup.",
  },
  {
    match: /^Re:Zero kara Hajimeru Isekai Seikatsu$/,
    format: "TV",
    slug: "re-zero",
    displayTitle: "Re:Zero - Starting Life in Another World",
    synopsis:
      "Subaru terlempar ke dunia lain dan menemukan bahwa kematian mengembalikannya ke titik waktu tertentu. Ia berjuang melindungi orang-orang yang ia sayangi dari takdir buruk.",
  },
  {
    match: /^Kono Subarashii Sekai ni Shukufuku wo!$/,
    format: "TV",
    slug: "konosuba",
    displayTitle: "KonoSuba: God's Blessing on This Wonderful World!",
    synopsis:
      "Kazuma meninggal dan terlempar ke dunia fantasi bersama dewi yang merepotkan. Tim yang penuh kekurangan ini menghadapi monster dan utang.",
  },
  {
    match: /^Death Note$/,
    format: "TV",
    slug: "death-note",
    displayTitle: "Death Note",
    synopsis:
      "Light Yagami menemukan buku yang bisa membunuh siapa pun yang namanya ditulis. Ia memulai misi membersihkan dunia, sementara detektif misterius L memburunya.",
  },
  {
    match: /^Hunter x Hunter \(2011\)$/,
    format: "TV",
    slug: "hunter-x-hunter",
    displayTitle: "Hunter x Hunter",
    synopsis:
      "Gon mencari ayahnya yang hilang dan menjadi Hunter. Ia bertemu Killua, Kurapika, dan Leorio dalam petualangan yang semakin gelap.",
  },
  {
    match: /^Code Geass: Hangyaku no Lelouch$/,
    format: "TV",
    slug: "code-geass",
    displayTitle: "Code Geass: Lelouch of the Rebellion",
    synopsis:
      "Lelouch memperoleh kekuatan untuk memerintah orang dan memimpin pemberontakan melawan Kekaisaran Britannia. Strategi, pengkhianatan, dan harga kebebasan menjadi inti cerita.",
  },
  {
    match: /^Boku no Hero Academia$/,
    format: "TV",
    slug: "my-hero-academia",
    displayTitle: "My Hero Academia",
    synopsis:
      "Di dunia yang hampir semua orang memiliki kekuatan super, Izuku Midoriya terlahir tanpa quirk. Ia mewarisi kekuatan dari pahlawan terbesar dan masuk sekolah pahlawan.",
  },
  {
    match: /^Tenki no Ko$/,
    format: "MOVIE",
    slug: "weathering-with-you",
    displayTitle: "Weathering with You",
    synopsis:
      "Seorang remaja melarikan diri ke Tokyo dan bertemu gadis yang bisa mengubah cuaca. Mereka menghadapi pilihan antara kebahagiaan pribadi dan keselamatan kota.",
  },
  {
    match: /^Made in Abyss$/,
    format: "TV",
    slug: "made-in-abyss",
    displayTitle: "Made in Abyss",
    synopsis:
      "Riko dan Reg menyusuri Abyss, jurang misterius yang penuh makhluk berbahaya. Petualangan mereka membuka rahasia gelap tentang dunia dan masa lalu Reg.",
  },
  {
    match: /^Koe no Katachi$/,
    format: "MOVIE",
    slug: "a-silent-voice",
    displayTitle: "A Silent Voice",
    synopsis:
      "Shoya, mantan pembuli, berusaha menebus kesalahannya kepada Shoko, gadis tuli yang ia sakiti. Cerita tentang penyesalan, komunikasi, dan penerimaan diri.",
  },
  {
    match: /^Perfect Blue$/,
    format: "MOVIE",
    slug: "perfect-blue",
    displayTitle: "Perfect Blue",
    synopsis:
      "Seorang idola pop beralih ke akting dan mulai kehilangan batas antara kenyataan dan fantasi. Ketegangan psikologis meningkat saat seseorang menguntitnya.",
  },
  {
    match: /^Ookami Kodomo no Ame to Yuki$/,
    format: "MOVIE",
    slug: "wolf-children",
    displayTitle: "Wolf Children",
    synopsis:
      "Seorang ibu membesarkan dua anak setengah serigala setelah suaminya meninggal. Mereka pindah ke desa untuk hidup tenang dan memilih jalan masing-masing.",
  },
];

/** Fall 2026 titles selected for a balanced demo catalog. */
const FALL_PICKS = [
  "#Zombie Sagashitemasu",
  "Ao Ashi Season 2",
  "Ao no Hako Season 2",
  "Battle Spirits [Re] Zekkai no Kuu",
  "Black Clover 2nd Season",
  "Cardfight!! Vanguard: Divinez Unmei Seisen-hen",
  "Choujun! Choujou-senpai",
  "Dark Summoner to Dekiteiru",
  "Dia no Ace: Act II Second Season Dai 2 Cour",
  "Doumo, Suki na Hito ni Horegusuri o Irai Sareta Majo desu.",
  "Dragon Ball Super: Beerus",
  "Gensou Suikoden",
  "Hotaru no Yomeiri",
  "Hotel Inhumans 2nd Season",
  "Hyouken no Majutsushi ga Sekai o Suberu II",
  "Junket Bank",
  "Keroro Gunsou ☆",
  "Kikansha no Mahou wa Tokubetsu desu 2nd Season",
  "Kizu Darake Seijo yori Houfuku o Komete Season 2",
  "Koori no Jouheki 2nd Season",
  "Kusuriya no Hitorigoto 3rd Season",
  "Kyoufu Collector",
  "Kyouran Reijou Nia Liston: Byoujaku Reijou ni Tensei shita Kamigoroshi no Bujin no Karei Naru Musouroku",
  "Magic Knight Rayearth (2026)",
  "Magical★Explorer",
  "Mahou Shoujo Ikusei Keikaku: Restart",
  "Mahou no Shimai Lulutto Lily Cour 2",
  "Marronnier Oukoku no Shichinin no Kishi",
  "Mezametara Saikyou Soubi to Uchuusenmochi Datta node, Ikkodate Mezashite Youhei toshite Jiyuu ni Ikitai",
  "Ojisan wa Kawaii Mono ga Osuki.",
  "Psyren",
  "Ranma 1/2 Dai 3 Ki",
  "Sasaki to Pii-chan Season 2",
  "Seitokai ni mo Ana wa Aru!",
  "Sekai Saikyou no Majo, Hajimemashita",
  "Shiotaiou no Satou-san ga Ore ni dake Amai",
  "Shuiro no Kamen",
  "Tank Chair: Sensha Isu",
  "Tantei wa Mou, Shindeiru. Season 2",
  "Tempal: Item no Chikara",
  "Tensei Goblin da kedo Shitsumon Aru?",
  "Tensei Kizoku, Kantei Skill de Nariagaru 3rd Season",
  "Tensei shita Daiseijo wa, Seijo de Aru Koto wo Hitakakusu",
  "Tensei shitara Ken deshita 2",
  "Tetsuryou! Meet with Tetsudou Musume",
  "Toaru Anbu no Item",
  "Tokyo Revengers: Santen Sensou-hen",
  "Tougen Anki: Nikko Kegon no Taki-hen",
  "Vertex Force",
  "Yowaki Max Reijou nanoni, Ratsuwan Konyakusha-sama no Kake ni Notte Shimatta",
  "Kusuriya no Hitorigoto Movie",
  "Made in Abyss: Mezameru Shinpi",
  "Girls & Panzer: Saishuushou Part 5",
  "Saishuu Gakushou Hibike! Euphonium - Kouhen",
  "Seishun Buta Yarou wa Dear Friend no Yume wo Minai",
  "Cyberpunk: Edgerunners 2",
  "BanG Dream! Ave Mujica: Prima Aurora",
  "Rakuen Tsuihou: Kokoro no Resonance",
];

const ADULT_TAGS = new Set(["erotica", "hentai", "explicit", "pornography", "smut"]);

const STUDIO_NAMES = new Map([
  ["mappa", "MAPPA"],
  ["mappa co., ltd.", "MAPPA"],
  ["madhouse", "Madhouse"],
  ["madhouse inc.", "Madhouse"],
  ["ufotable", "ufotable"],
  ["ufotable, inc.", "ufotable"],
  ["bones", "Bones"],
  ["bones inc.", "Bones"],
  ["wit studio", "WIT Studio"],
  ["wit studio, inc.", "WIT Studio"],
  ["cloverworks", "CloverWorks"],
  ["cloverworks inc.", "CloverWorks"],
  ["a-1 pictures", "A-1 Pictures"],
  ["a-1 pictures inc.", "A-1 Pictures"],
  ["production i.g", "Production I.G"],
  ["production i.g., inc.", "Production I.G"],
  ["kyoto animation", "Kyoto Animation"],
  ["kyoto animation co., ltd.", "Kyoto Animation"],
  ["sunrise", "Sunrise"],
  ["sunrise inc.", "Sunrise"],
  ["toei animation", "Toei Animation"],
  ["toei animation co., ltd.", "Toei Animation"],
  ["white fox", "White Fox"],
  ["white fox co., ltd.", "White Fox"],
  ["j.c. staff", "J.C.Staff"],
  ["j.c.staff", "J.C.Staff"],
  ["j.c. staff co., ltd.", "J.C.Staff"],
  ["j.c.staff co., ltd.", "J.C.Staff"],
  ["olm", "OLM"],
  ["olm, inc.", "OLM"],
  ["science saru", "Science SARU"],
  ["science saru inc.", "Science SARU"],
  ["trigger", "Trigger"],
  ["trigger inc.", "Trigger"],
  ["david production", "David Production"],
  ["david production inc.", "David Production"],
  ["liden films", "Liden Films"],
  ["liden films inc.", "Liden Films"],
  ["polygon pictures", "Polygon Pictures"],
  ["polygon pictures inc.", "Polygon Pictures"],
  ["p.a. works", "P.A. Works"],
  ["p.a. works co., ltd.", "P.A. Works"],
  ["studio deen", "Studio Deen"],
  ["studio deen co., ltd.", "Studio Deen"],
  ["8 bit", "8bit"],
  ["kinema citrus", "Kinema Citrus"],
  ["kinema citrus co., ltd.", "Kinema Citrus"],
  ["shin-ei animation", "Shin-Ei Animation"],
  ["shin-ei animation co., ltd.", "Shin-Ei Animation"],
  ["silver link.", "Silver Link."],
  ["passione", "Passione"],
  ["passione co., ltd.", "Passione"],
  ["tezuka productions", "Tezuka Productions"],
  ["tezuka productions co., ltd.", "Tezuka Productions"],
  ["studio kai", "Studio Kai"],
  ["studio mother", "Studio Mother"],
  ["studio mother inc.", "Studio Mother"],
  ["bandai namco pictures", "Bandai Namco Pictures"],
  ["bandai namco pictures inc.", "Bandai Namco Pictures"],
  ["bn pictures", "BN Pictures"],
  ["pierrot co., ltd.", "Pierrot"],
  ["pierrot", "Pierrot"],
  ["e&h production co., ltd.", "E&H Production"],
  ["satelight inc.", "Satelight"],
  ["satelight", "Satelight"],
  ["doga kobo", "Doga Kobo"],
  ["doga kobo inc.", "Doga Kobo"],
  ["actas", "Actas"],
  ["tms entertainment", "TMS Entertainment"],
  ["tms entertainment co., ltd.", "TMS Entertainment"],
  ["atelier pontdarc", "Atelier Pontdarc"],
  ["100studio", "100studio"],
  ["engi co.ltd.", "ENGI"],
  ["engi", "ENGI"],
  ["studio bind", "Studio Bind"],
  ["studio bind inc.", "Studio Bind"],
  ["arbor animation inc.", "Arbor Animation"],
  ["arvo animation inc.", "Arvo Animation"],
  ["aisle co., ltd.", "Aisle"],
  ["cue co., ltd.", "CUE"],
  ["felix film", "Felix Film"],
  ["c2c co., ltd.", "C2C"],
  ["c2c", "C2C"],
  ["jumondou co., ltd.", "Jumondou"],
  ["diomedéa inc.", "Diomedéa"],
  ["diomedea", "Diomedéa"],
  ["zero-g, inc.", "Zero-G"],
  ["zero-g", "Zero-G"],
  ["atelier", "Atelier"],
  ["gift-o’-animation", "Gift-o'-Animation"],
  ["toho animation studio", "Toho Animation Studio"],
  ["toho animation", "Toho Animation"],
  ["sanzigen", "Sanzigen"],
  ["fanworks", "Fanworks"],
  ["tecarat", "Tecarat"],
  ["east fish studio lnc.", "East Fish Studio"],
  ["shogakukan music & digital entertainment", "Shogakukan Music & Digital Entertainment"],
  ["kayac animation", "KAYAC Animation"],
  ["synergysp co. ,ltd.", "SynergySP"],
  ["synergy sp", "SynergySP"],
  ["konami animation", "Konami Animation"],
  ["studio hibari", "Studio Hibari"],
  ["studio comet co., ltd.", "Studio Comet"],
  ["studio a-cat", "Studio A-Cat"],
  ["bakkka inc.", "Bakkka"],
  ["arvo animation", "Arvo Animation"],
  ["gift-o’-animation", "Gift-o'-Animation"],
]);

function slugify(input) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueSlug(base, used) {
  let slug = base || "anime";
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  used.add(slug);
  return slug;
}

function titleCaseStudio(name) {
  const key = name.trim().toLowerCase();
  if (STUDIO_NAMES.has(key)) return STUDIO_NAMES.get(key);
  const cleaned = name
    .replace(/\b(co\.,? ?ltd\.?|inc\.?|llc|corporation|corp\.?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned
    .split(" ")
    .map((word) => (word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

function durationMinutes(duration) {
  if (!duration?.value || !duration?.unit) return null;
  if (duration.unit === "MINUTES") return duration.value;
  if (duration.unit === "SECONDS") return Math.max(1, Math.round(duration.value / 60));
  if (duration.unit === "HOURS") return duration.value * 60;
  return null;
}

function mapGenres(tags) {
  const normalized = new Set((tags ?? []).map((tag) => tag.toLowerCase()));
  const result = [];
  for (const [slug, needles] of GENRE_RULES) {
    if (needles.some((needle) => normalized.has(needle))) {
      result.push(slug);
      if (result.length === 4) break;
    }
  }
  return result.length > 0 ? result : ["lainnya"];
}

function isAdult(tags) {
  return (tags ?? []).some((tag) => ADULT_TAGS.has(tag.toLowerCase()));
}

function percentEncodeTitle(title) {
  return encodeURIComponent(title);
}

function platformSearchUrl(platform, title) {
  return platform.searchUrlTemplate.replace("{q}", percentEncodeTitle(title));
}

function mediaStatus(entry, currentSeason) {
  if (currentSeason) return "RELEASING";
  if (entry.status === "ONGOING") return "RELEASING";
  if (entry.status === "UPCOMING") return "NOT_YET_RELEASED";
  if (entry.status === "FINISHED") return "FINISHED";
  return "UNKNOWN";
}

const usedSlugs = new Set();
const usedStudioSlugs = new Set();
const studiosBySlug = new Map();
const media = [];

function addMedia(entry, curated) {
  const titleRomaji = entry.title;
  const displayTitle = curated?.displayTitle ?? titleRomaji;
  const slug = uniqueSlug(curated?.slug ?? slugify(titleRomaji), usedSlugs);
  const genres = mapGenres(entry.tags);
  const isFall2026 = entry.animeSeason?.season === "FALL" && entry.animeSeason?.year === 2026;
  const score =
    typeof entry.score?.arithmeticGeometricMean === "number" && !isFall2026
      ? Math.round(entry.score.arithmeticGeometricMean * 100) / 100
      : null;
  const sourceCount = entry.sources?.length ?? 0;
  const popularity = score
    ? Math.round(score * 1000) + sourceCount
    : sourceCount * 100 + (entry.episodes ?? 0);
  const studioNames = [...new Set((entry.studios ?? []).map(titleCaseStudio))].filter(Boolean).slice(0, 3);
  const studioSlugs = [];
  for (const name of studioNames) {
    const studioSlug = uniqueSlug(slugify(name), usedStudioSlugs);
    if (!studiosBySlug.has(studioSlug)) {
      studiosBySlug.set(studioSlug, { slug: studioSlug, name });
    }
    studioSlugs.push(studioSlug);
  }

  const platformSlugs = curated
    ? ["bstation", "crunchyroll", "netflix"]
    : isFall2026
      ? ["bstation", "crunchyroll", ["netflix", "iqiyi", "vidio", "prime-video"][media.length % 4]]
      : ["crunchyroll", "bstation", "prime-video"];

  const streaming = [...new Set(platformSlugs)].map((platformSlug) => {
    const platform = PLATFORMS.find((p) => p.slug === platformSlug);
    return {
      platformSlug,
      url: platformSearchUrl(platform, displayTitle),
      language: "UNKNOWN",
      accessType: "SEARCH",
      status: "SEARCH_ONLY",
      note: "Tautan pencarian. Ketersediaan judul dan subtitle berbeda per region.",
    };
  });

  const schedule =
    isFall2026 && entry.type === "TV" && entry.episodes > 0
      ? {
          dayOfWeek: (media.length % 7) + 1,
          timeWib: ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"][media.length % 12],
          baseEpisode: Math.min(6, entry.episodes),
          baseDate: "2026-11-09",
          episodes: entry.episodes,
          confidence: "ESTIMATED",
          source: "ODbL + demo schedule",
        }
      : null;

  media.push({
    slug,
    titleRomaji,
    titleEnglish: null,
    titleNative: null,
    titleId: curated?.displayTitle ?? null,
    synonyms: [...new Set([...(entry.synonyms ?? []), titleRomaji])].filter((s) => s && s !== titleRomaji).slice(0, 10),
    synopsisId: curated?.synopsis ?? null,
    format: entry.type,
    status: mediaStatus(entry, isFall2026),
    season: entry.animeSeason?.season ?? null,
    seasonYear: entry.animeSeason?.year ?? null,
    episodes: entry.episodes > 0 ? entry.episodes : null,
    durationMinutes: durationMinutes(entry.duration),
    scoreAvg: score,
    popularity,
    coverUrl: entry.picture ?? entry.thumbnail ?? null,
    bannerUrl: null,
    isAdult: isAdult(entry.tags) ? 1 : 0,
    contentStatus: curated ? "REVIEWED" : "MISSING",
    source: "anime-offline-database",
    sourceUrl: entry.sources?.[0] ?? null,
    updatedAt: "2026-11-09T00:00:00.000Z",
    genres,
    studios: studioSlugs,
    streaming,
    schedule,
  });
}

// Curated classics first, so they win the nicest slugs.
for (const curated of CURATED) {
  const hits = db.data
    .filter((entry) => curated.match.test(entry.title) && entry.type === curated.format)
    .sort(
      (a, b) =>
        (b.score?.arithmeticGeometricMean ?? 0) - (a.score?.arithmeticGeometricMean ?? 0),
    );
  if (hits.length === 0) {
    console.warn(`Curated title not found: ${curated.match}`);
    continue;
  }
  addMedia(hits[0], curated);
}

// Then the selected Fall 2026 catalog.
const fallEntries = new Map();
for (const entry of db.data) {
  if (
    entry.animeSeason?.season === "FALL" &&
    entry.animeSeason?.year === 2026 &&
    FALL_PICKS.includes(entry.title) &&
    !isAdult(entry.tags)
  ) {
    fallEntries.set(entry.title, entry);
  }
}
for (const title of FALL_PICKS) {
  const entry = fallEntries.get(title);
  if (!entry) {
    console.warn(`Fall 2026 title not found: ${title}`);
    continue;
  }
  addMedia(entry, null);
}

const genres = GENRES.map((genre, index) => ({ id: index + 1, ...genre }));
const platforms = PLATFORMS.map((platform, index) => ({ id: index + 1, ...platform }));
const studios = [...studiosBySlug.values()]
  .map((studio, index) => ({ id: index + 1, ...studio }))
  .sort((a, b) => a.name.localeCompare(b.name));

const seed = {
  generatedAt: new Date().toISOString(),
  source: {
    name: "anime-offline-database",
    license: "ODbL-1.0",
    release: "2026-27",
    url: "https://github.com/manami-project/anime-offline-database",
    note: "Subset for development. Poster URLs point to third-party sources and are not licensed by ODbL.",
  },
  currentSeason: { season: "FALL", year: 2026 },
  genres,
  platforms,
  studios,
  media,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(seed, null, 2));
console.log(
  `Wrote ${media.length} media, ${genres.length} genres, ${studios.length} studios, ${platforms.length} platforms to ${outputPath}`,
);
