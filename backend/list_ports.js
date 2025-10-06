// backend/list_ports.js
const { SerialPort } = require('serialport');

SerialPort.list().then(ports => {
  console.log('Available serial ports:');
  ports.forEach(p => {
    console.log(p.path, p.manufacturer || '', p.productId || '', p.vendorId || '');
  });
}).catch(err => {
  console.error('Error listing ports:', err);
});
