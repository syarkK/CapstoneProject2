// backend/serial_echo.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const portPath = process.argv[2] || 'COM5';
const baud = Number(process.argv[3] || 115200);

const port = new SerialPort({ path: portPath, baudRate: baud, autoOpen: true });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.on('open', () => console.log('OPEN', portPath, baud));
port.on('error', (e) => console.error('PORT ERROR', e.message));

parser.on('data', (line) => {
  console.log('LINE:', line);
});
