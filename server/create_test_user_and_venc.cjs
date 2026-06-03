const mongoose = require('mongoose');
const path = require('path');

async function main() {
  const uri = 'mongodb://127.0.0.1:27018/monotributo_saas';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to', uri);

  const User = require(path.join(__dirname, 'models', 'User'));
  const ConfiguracionAfip = require(path.join(__dirname, 'models', 'ConfiguracionAfip'));
  const Vencimiento = require(path.join(__dirname, 'models', 'Vencimiento'));

  function adjustToNextBusinessDay(date) {
    const d = new Date(date);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }

  // Create test user
  const testUser = new User({
    googleUid: 'test-google-uid-3',
    email: 'test3@example.com',
    emailNotificaciones: 'test3@example.com',
    nombreCompleto: 'Usuario Test 3',
    cuit: '23-99999999-1',
    categoriaMonotributo: 'B',
    perfilCompleto: true,
  });

  await testUser.save();
  console.log('Created user', testUser._id.toString());

  const config = await ConfiguracionAfip.findOne({ categoria: testUser.categoriaMonotributo });
  const monto = config ? config.montoMensual : 0;

  const year = new Date().getFullYear();
  const docs = [];
  for (let month = 0; month < 12; month++) {
    const raw = new Date(year, month, 20, 12, 0, 0);
    const fecha = adjustToNextBusinessDay(raw);
    docs.push({
      userId: testUser._id,
      tipo: 'monotributo',
      descripcion: 'AFIP - Monotributo',
      monto,
      fechaVencimiento: fecha,
      estado: 'pendiente',
    });
  }

  const created = await Vencimiento.insertMany(docs);
  console.log('Inserted vencimientos:', created.map((c) => c.fechaVencimiento.toISOString()));

  await mongoose.disconnect();
  console.log('Disconnected');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
