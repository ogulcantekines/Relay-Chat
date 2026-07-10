import dotenv from "dotenv";

// Bu modül, .env dosyasını diğer tüm modüllerden önce yükler.
// ES module import'ları hoist edildiği için dotenv.config() çağrısının
// server.js gövdesinde bulunması yeterli değildir; socket.js gibi
// import anında process.env okuyan modüller .env yüklenmeden çalışırdı.
// Bu yüzden env yüklemesi kendi modülüne alındı ve en üstte import ediliyor.
dotenv.config();
