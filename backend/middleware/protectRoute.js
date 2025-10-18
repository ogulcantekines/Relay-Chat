import jwt from "jsonwebtoken";


const protectRoute = async (req, res, next) => {
    const token = req.cookies.token || ""; //çerezdeki token'ı al
    
    if (!token) {
        return res.status(401).send({message: "Unauthorized: No token provided"});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); //token'ı doğrula içindeki secret ile  process.env.JWT_SECRET aynı mı verify et eğer doğruysa decode'a at
        req.userId = decoded.id;
        next();
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(401).send({message: "Unauthorized: Invalid token"});
    }

};

export default protectRoute;
    