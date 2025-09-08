const { createTnsrClient } = require("tnsr-client");

const client = createTnsrClient({
  url: "http://192.168.1.1:8080",
  username: "username",
  password: "password",
});

client
  .testConnection()
  .then(() => {
    console.log("Connection successful!");
  })
  .catch((error) => {
    console.error("Connection failed:", error);
  });

client.listNetworks().then((networks) => {
  console.log("Available networks:", networks);
});
