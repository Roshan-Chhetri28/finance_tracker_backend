import jwt from 'jsonwebtoken'

export default function(req, res, next){
       const token = req.header('x-access-token');
    //Check if no token
    if(!token)
    {
        return res.status(401).json({msg:'No token, authorization denied'});
    }
    //Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({msg: 'Token is not valid'});
    }
}