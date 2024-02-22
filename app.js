const fs = require('fs');
const https = require('https');
const cors = require('cors')
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const tls = require('tls'); // Asegúrate de incluir esta línea

const app = express();

// Función para obtener las credenciales según el nombre del host
function getCredential(context) {
console.log(context)
  
if (context === 'www.asistente.intervia.com.ar') {
  return {
    key: fs.readFileSync('Certificado/3cert/private.key', 'utf8'),
    cert: fs.readFileSync('Certificado/3cert/certificate.crt', 'utf8'),
    ca: fs.readFileSync('Certificado/3cert/ca_bundle.crt', 'utf8')
  };
} else if (context === 'www.soporte.intervia.com.ar') {
    return {
      key: fs.readFileSync('Certificado/2cert/private.key', 'utf8'),
      cert: fs.readFileSync('Certificado/2cert/certificate.crt', 'utf8'),
      ca: fs.readFileSync('Certificado/2cert/ca_bundle.crt', 'utf8')
    };
  } else  if (context == 'remoto.rhglobal.com.ar'){
    return {
      key: fs.readFileSync('Certificado/1cert/private.key', 'utf8'),
      cert: fs.readFileSync('Certificado/1cert/certificate.crt', 'utf8'),
      ca: fs.readFileSync('Certificado/1cert/ca_bundle.crt', 'utf8')
    };
  }
  // Por defecto retorna un certificado (puede ser un certificado genérico o un mensaje de error)
  return {
    key: fs.readFileSync('Certificado/1cert/private.key', 'utf8'),
    cert: fs.readFileSync('Certificado/1cert/certificate.crt', 'utf8')
  };
}


const proxyTo6000 = createProxyMiddleware({
  target: 'https://localhost:8085',
  changeOrigin: true,
  ws: true, // Si quieres proxy para websockets
  secure: false // Si los certificados SSL son auto-firmados
});

// Configuración del proxy para el primer dominio
const proxyTo4000 = createProxyMiddleware({
  target: 'https://localhost:8558',
  changeOrigin: true,
  ws: true, // Si quieres proxy para websockets
  secure: false // Si los certificados SSL son auto-firmados
});

// Configuración del proxy para el segundo dominio
const proxyTo5000 = createProxyMiddleware(
  {
  target: 'https://10.5.0.44:8558',
  changeOrigin: true,
  ws: true, // Si quieres proxy para websockets
  secure: false // Si los certificados SSL son auto-firmados
});

// Middleware para detectar el dominio y redirigir
app.use((req, res, next) => {
  
 // getCredential(req.hostname)
 if (req.hostname === 'www.asistente.intervia.com.ar') {
  return proxyTo6000(req, res, next);
} else if (req.hostname === 'www.soporte.intervia.com.ar') {
    return proxyTo4000(req, res, next);
  } else {
    return proxyTo5000(req, res, next);
  } 
});

// Crea un servidor HTTPS con SNI (Server Name Indication)
const httpsServer = https.createServer({
  SNICallback: (servername, cb) => {
    const creds = getCredential(servername);
    if (cb) {
      cb(null, tls.createSecureContext(creds));
    } else {
      return tls.createSecureContext(creds);
    }
  },

}, app);

// Escucha en el puerto 443
httpsServer.listen(3050, () => {
  console.log('Servidor HTTPS escuchando en el puerto 443');
});










/*


const fs = require('fs');
const https = require('https');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Lee los certificados SSL y la cadena de certificados (CA bundle)
const privateKey = fs.readFileSync('Certificado/private.key', 'utf8');
const certificate = fs.readFileSync('Certificado/certificate.crt', 'utf8');
const caBundle = fs.readFileSync('Certificado/ca_bundle.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate, ca: caBundle };

// Configuración del proxy para el primer dominio
const proxyTo4000 = createProxyMiddleware({
  target: 'https://localhost:4000',
  changeOrigin: true,
  ws: true, // Si quieres proxy para websockets
  secure: false // Si los certificados SSL son auto-firmados
});

// Configuración del proxy para el segundo dominio
const proxyTo5000 = createProxyMiddleware({
  target: 'https://localhost:5000',
  changeOrigin: true,
  ws: true, // Si quieres proxy para websockets
  secure: false // Si los certificados SSL son auto-firmados
});

// Middleware para detectar el dominio y redirigir
app.use((req, res, next) => {
  if (req.hostname === 'www.soporte.intervia.com.ar') {
    return proxyTo4000(req, res, next);
  } else if (req.hostname === 'segundodominio.com') {
    return proxyTo5000(req, res, next);
  } else {
    res.status(404).send('No encontrado');
  }
});

// Crea un servidor HTTPS con tus credenciales y tu app de Express
const httpsServer = https.createServer(credentials, app);

// Escucha en el puerto 443
httpsServer.listen(8000, () => {
  console.log('Servidor HTTPS escuchando en el puerto 443');
});


*/