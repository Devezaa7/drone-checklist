const jwt = require('jsonwebtoken');
const autenticar = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  if (!token) {
    return res.status(401).json({ erro: 'Não autorizado' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido' });
  }
};
const apenasCCO = (req, res, next) => {
  if (req.usuario.perfil !== 'cco') {
    return res.status(403).json({ erro: 'Acesso restrito ao CCO' });
  }
  next();
};
module.exports = { autenticar, apenasCCO };