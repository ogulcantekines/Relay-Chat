import dotenv from "dotenv";

// Bu modül, .env dosyasını diğer tüm modüllerden önce yükler.
// ES module import'ları hoist edildiği için dotenv.config() çağrısının
// server.js gövdesinde bulunması yeterli değildir; socket.js gibi
// import anında process.env okuyan modüller .env yüklenmeden çalışırdı.
// Bu yüzden env yüklemesi kendi modülüne alındı ve en üstte import ediliyor.
dotenv.config();

// Çerez güvenlik ayarları tek yerde.
//
// Secure bayrağı tarayıcıya çerezi yalnızca HTTPS üzerinden saklamasını söyler.
// Production'da doğru olan budur, ancak uygulama düz HTTP ile (örneğin yerel
// ağda 192.168.x.x üzerinden) sunulduğunda tarayıcı çerezi tamamen atar ve
// giriş yapılamaz. Bu yüzden bayrak NODE_ENV'e değil, açıkça verilen
// COOKIE_SECURE değerine bağlı: HTTPS arkasına alındığında "true" yapılır.
export const cookieSecure = process.env.COOKIE_SECURE === "true";

// Lax, normal gezinmede çerezin gönderilmesine izin verirken CSRF'e karşı
// Strict'e yakın koruma sağlar ve harici bağlantıdan gelen kullanıcının
// oturumunu düşürmez.
export const cookieSameSite = "lax";
