import mongoose from "mongoose";
import Conversation from "../models/conservation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// mesaj gönderme fonksiyonu
export const sendMessage = async (req, res) => {
    try{
        const { id:receiverId } = req.params; // url deki :id yi alıp receiverId ye ata
        const { message } = req.body; // request body den mesajı al
        const senderId = req.userId; // protectRoute middleware den gelen userId (giriş yapan kullanıcı)

        let conversation = await Conversation.findOne( //conversations collectionında senderId ve receiverId yi içeren konuşmayı bul
            { participants: { $all: [senderId, receiverId] } } //$all operatörü ile her iki kullanıcıyı da içeren belgeyi bul,sırası önemli değil
        );

        if (!conversation) { // konuşma yoksa yeni konuşma oluştur
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                messages: []
            });
        }

        const newMessage = new Message({ // message modeline uygun messages collectionına yeni mesaj
            senderId: senderId,
            receiverId: receiverId,
            message: message,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);  // konuşmanın messages arrayine yeni mesajın id sini ekle. Get message da populate etmek için hayati
        }
        // Mesaj ve konuşmayı paralel olarak kaydet - performans için
        await Promise.all([conversation.save(), newMessage.save()]);

        // SOCKET.IO - Real-time mesaj gönderimi - alıcı online ise anında ilet bu dbye kaydedildikten sonra anlık olarak websocket ile gönder
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
       
        // Return the saved message as JSON
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).send("Internal Server Error");
    }

};

// belirli bir kullanıcıyla olan mesajları al
export const getMessage = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.userId; // protectRoute middleware den gelen userId (giriş yapan kullanıcı)

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] }
        }).populate("messages"); // conversation içindeki messages, normalde referans ettiği Message ye yani messages collectionına referans bilgisini ve id bilgisini tutar.
        //populate ise eğer id bilgisi referans aldığı collectionda varsa o nesneyi ve tüm propertylerini getirir
       
        if (!conversation) {
            return res.status(200).json([]);
        }

        const messages = conversation.messages;
        res.status(200).json(messages);

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// sohbeti temizleme fonksiyonu
export const clearConversation = async (req, res) => {
    try{
        const { id: userToChatId } = req.params; // url deki :id yi alıp userToChatId ye ata
        const senderId = req.userId; // protectRoute middleware den gelen userId (giriş yapan kullanıcı)

        const conversation = await Conversation.findOne({ // conversations collectionında senderId ve userToChatId yi içeren konuşmayı bul
            participants: { $all: [senderId, userToChatId] } //$all operatörü ile her iki kullanıcıyı da içeren belgeyi bul,sırası önemli değil
        });

        if(!conversation) { //conversation yoksa silinecek bir şey yok
            return res.status(404).json({error: "Conversation not found"});
        }
        if(conversation.messages.length === 0) { // zaten mesaj yoksa silinecek bir şey yok
            return res.status(200).json({message: "No messages to delete"});
        }

        // ✅ Silinen mesaj sayısını ÖNCEden kaydet!
        const deletedCount = conversation.messages.length;

        await Message.deleteMany({//deleteMany ile conversation içindeki tüm mesajları sil
            _id: { $in: conversation.messages } //conversation.messages bu kısım messages arrayi içindeki tüm id leri alıyor
        }); // $in operatörü, bir alanın değerinin belirli bir dizi içinde olup olmadığını kontrol eder
        //messages koleksiyonunda _id si conversation içindeki messages arrayinde olan tüm mesajları siler çünkü conversations koleksiyonunda
        // sadece mesajların id leri tutuluyor, mesajların kendisi değil _id messages koleksiyonunun idsine denk geliyor

        conversation.messages = []; // conversation içindeki messages arrayini boşalt
        await conversation.save();//db ye kaydet

        res.status(200).json({
            message: "Conversation cleared", 
            deletedCount: deletedCount  // ✅ Önceden kaydedilen değeri kullan!
        });
    }
    catch (error) {
        console.error("Error clearing conversation:", error);
        res.status(500).json({error: "Internal Server Error"});
    }

};

// mesaj düzenleme fonksiyonu
export const editMessage = async (req, res) =>  {
    try{
        const {id: messageId} = req.params; //adress çubuğundaki :id yi alıp messageId ye ata
        const{newMessage} = req.body; // request body den yeni mesajı al, frontendden düzenlenen mesaj
        const userId = req.userId; //protectRoute middleware den gelen userId

        const message = await Message.findById(messageId); //messages collectionından messageId ile mesajı bul,hangi mesaj düzenlenecekse

        if(!message){ // gelen id ile ilgili mesaj bulunamazsa 
            return res.status(404).json({error: "Message not found"});
        }

        if(message.senderId.toString() !== userId){ //giriş yapan kullanıcı mesajın sahibi değilse
            return res.status(403).json({error: "Forbidden. You can only edit your own messages."});
         }

         if(!newMessage || newMessage.trim() === ""){ //yeni mesaj boşsa
            return res.status(400).json({error : "Message content cannot be empty"});
        }

        message.message = newMessage.trim(); //mesajı yeni mesajla güncelle
        message.isEdited = true;
        message.editedAt = Date.now();  
        
        await message.save();//db ye kaydet

        // SOCKET.IO - Real-time mesaj düzenleme bildirimi - alıcı online ise anında ilet bu dbye kaydedildikten sonra anlık olarak websocket ile gönder
        const receiversocketId = getReceiverSocketId(message.receiverId);
        if(receiversocketId){
            io.to(receiversocketId).emit("messageEdited", { // messageEdited eventini alıcıya emit et, bu nesneyi yolla
                messageId: message._id,
                newMessage: message.message,
                isEdited: message.isEdited,
                editedAt: message.editedAt
            });
        }

        res.status(200).json({//düzenlenen mesajı dön
            message: "Message edited successfully",
            updatedMessage: message
        });


    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};





