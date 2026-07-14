import Conversation from "../models/conversation.model.js";

//Tüm conversationları getir
export const getConversations = async (req, res) => {
    try {
        const userId = req.userId;

        const conversations = await Conversation.find({
            participants: { $in: [userId] } // participants içinde userId varsa bu conversationları getir
        })
            .populate("participants", "fullName username profilePic friendCode") //participantsı populate et, burada idlerin tutulduğunu ve users collectionına referans oldugunu bilerek sifre dısındaki degerleri getirerek nesneyi cagir
            .populate({ //burada da messagesi populate var burada da sadece idleri tutuluyor. ana referans ettigi messages collectionından nesne hallerini getir
                path: "messages",
                // Kullanıcının temizlediği mesajlar önizlemede görünmemeli
                match: { clearedBy: { $ne: userId } },
                options: { sort: { createdAt: -1 }, limit: 1 }
            })//ama burada secenek kısmında oluşturulma tarihine göre descending, desc , -1 gibi terimler kullanarak yeniden eskiye dogru sıralanır. limit ile de kac tane secilecegini belirler
            .sort({ updatedAt: -1 });//burada da find array dondugunden her bir conv buyuk bir nesneyi temsil eder. userıdinin katıldığı kac conversation varsa arrayde yazılır
        //bunların en son guncellenen convları yeniden eskiye sıralanır. yani en son mesaj gelen veya giden iilk sırada olur gibi dusun.

        //ayrıca .populate in populate("participants", -password) gibi kısa yazımı varken
        //.populate({path:"participants", select:"fullName username profilePic friendCode"})
        //şeklinde de yazılabilir. bu mongodbde ki {} kullanımı özelliklerde veya operatörlerde kullanılır bunu unutma

        res.status(200).json(conversations);

    } catch (error) {
        res.status(500).json({ message: error.message })

    }
}

//status parametresine göre conversationları getir aktif veya pending
export const getConversationsByStatus = async (req, res) => {
    try {
        const userId = req.userId;
        const { status } = req.params;

        const conversations = await Conversation.find({
            participants: userId,
            status: status
        })
            .populate("participants", "fullName username profilePic friendCode")
            .populate({
                path: "messages",
                // Kullanıcının temizlediği mesajlar önizlemede görünmemeli
                match: { clearedBy: { $ne: userId } },
                options: { sort: { createdAt: -1 }, limit: 1 }
            })
            .sort({ updatedAt: -1 });

        res.status(200).json(conversations);

    } catch (error) {
        console.error("Error getting conversations by status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const acceptConversation = async (req, res) => {

    try {
        const { id: conversationId } = req.params;
        const userId = req.userId;

        //Yazışmayı bul (Kullanıcının katılımcı olduğundan emin ol)
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        //kilidi aç durumu aktif yap
        conversation.status = "active";
        await conversation.save();

        //güncel hali geri dön
        res.status(200).json(conversation);

    } catch (error) {
        console.error("Error accepting conversation:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
