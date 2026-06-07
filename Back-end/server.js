const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "pedidos.json");

app.use(cors());
app.use(express.json());

function leerPedidos() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]");
  }

  const data = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(data);
}

function guardarPedidos(pedidos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(pedidos, null, 2));
}

function validarPedido({ jugador, videojuego, plataforma, cantidad }) {
  if (!jugador || !videojuego || !plataforma || !cantidad) {
    return "Todos los campos son obligatorios";
  }

  if (Number(cantidad) <= 0) {
    return "La cantidad debe ser mayor a 0";
  }

  return null;
}

function crearPedido(datos) {
  return {
    id: Date.now(),
    jugador: datos.jugador,
    videojuego: datos.videojuego,
    plataforma: datos.plataforma,
    cantidad: Number(datos.cantidad),
    estado: "pendiente",
    fecha: new Date().toISOString()
  };
}

app.get("/", (req, res) => {
  res.json({
    mensaje: "Backend de pedidos de videojuegos funcionando correctamente",
    rutas: {
      listarPedidos: "GET /pedidos",
      buscarPedido: "GET /pedidos/:id",
      crearPedido: "POST /pedidos"
    }
  });
});

app.get("/pedidos", (req, res) => {
  const pedidos = leerPedidos();
  res.json(pedidos);
});

app.get("/pedidos/:id", (req, res) => {
  const pedidos = leerPedidos();
  const pedido = pedidos.find((item) => item.id === Number(req.params.id));

  if (!pedido) {
    return res.status(404).json({
      error: "Pedido no encontrado"
    });
  }

  res.json(pedido);
});

app.post("/pedidos", (req, res) => {
  const error = validarPedido(req.body);

  if (error) {
    return res.status(400).json({ error });
  }

  const pedidos = leerPedidos();
  const nuevoPedido = crearPedido(req.body);

  pedidos.push(nuevoPedido);
  guardarPedidos(pedidos);

  res.status(201).json({
    mensaje: "Pedido de videojuego registrado correctamente",
    pedido: nuevoPedido
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutandose en http://localhost:${PORT}`);
});
