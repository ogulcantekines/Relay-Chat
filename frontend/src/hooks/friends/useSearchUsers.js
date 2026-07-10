import { useState, useEffect } from "react";

// useSearchUsers - Kullanıcı arama hook'u (debounce ile)
// AddFriend.jsx'te arama inputuna yazıldığında çalışır.
// searchQuery parametresi olarak arama terimini alır ve backend'de kullanıcı arar.
//
// 🔑 Debounce Mantığı:
// Kullanıcı her harf yazdığında backend'e istek atmak yerine, 500ms bekler.
// Bu sayede "ali" yazarken "a", "al", "ali" için 3 ayrı istek atmak yerine
// sadece son hali olan "ali" için 1 istek atar. Bu performansı artırır.

const useSearchUsers = (searchQuery) => {
    const [users, setUsers] = useState([]); // Arama sonuçları
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Eğer arama terimi boş veya 2 karakterden azsa, arama yapma
        if (!searchQuery || searchQuery.length < 2) {
            setUsers([]); // Sonuçları temizle
            return;
        }

        // setTimeout ile debounce: 500ms sonra isteği at
        // Kullanıcı yazmaya devam ederse, cleanup fonksiyonu eski timeout'u iptal eder
        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                // Backend'e GET isteği → /api/friends/search?query=arama_terimi
                // searchUsers controller'ı çalışır:
                // $regex ile kullanıcı adı veya friend code'da eşleşme arar
                // $options: "i" → büyük/küçük harf duyarsız arama
                const res = await fetch(`/api/friends/search?query=${searchQuery}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                const data = await res.json();

                if (!res.ok || data.error) {
                    throw new Error(data.error || "Kullanıcı bulunamadı");
                }

                setUsers(data); // Backend'den gelen kullanıcı listesini state'e yaz
            } catch (error) {
                console.error("Arama hatası:", error.message);
                setUsers([]); // Hata durumunda sonuçları temizle
            } finally {
                setLoading(false);
            }
        }, 500); // 500ms debounce süresi

        // Cleanup fonksiyonu: searchQuery değişirse veya component unmount olursa
        // eski timeout'u iptal et → gereksiz istek gönderilmesini önle
        return () => clearTimeout(timeoutId);

    }, [searchQuery]); // searchQuery her değiştiğinde effect yeniden çalışır

    return { users, loading };
};

export default useSearchUsers;

/*
📌 DEBOUNCE AKIŞI:
Kullanıcı "ali" yazar:

  "a" yazıldı → setTimeout(500ms) başladı
  200ms sonra "l" yazıldı → cleanup() eski timeout iptal → yeni setTimeout(500ms)
  300ms sonra "i" yazıldı → cleanup() eski timeout iptal → yeni setTimeout(500ms)
  500ms bekledi, başka harf yok → fetch("/api/friends/search?query=ali") çalışır ✅

  Sonuç: 3 harf için 1 istek (3 istek yerine) 🎯
*/