const admin = require('firebase-admin');
const serviceAccount = require("../src/aiesec-hris-firebase-adminsdk-jm89q-69ea10c068.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://my-app.firebaseio.com"
});

exports.member = require("./routes/member-routes");
exports.auth = require("./routes/auth-routes");
exports.data = require("./data/data");
