import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  GetItemCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

const TABLE_NAME = "PedidosGamer";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
};

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
    id: Date.now().toString(),
    jugador: datos.jugador,
    videojuego: datos.videojuego,
    plataforma: datos.plataforma,
    cantidad: Number(datos.cantidad),
    estado: "pendiente",
    fecha: new Date().toISOString()
  };
}

function convertirItemDynamoDB(item) {
  return {
    id: item.id.S,
    jugador: item.jugador.S,
    videojuego: item.videojuego.S,
    plataforma: item.plataforma.S,
    cantidad: Number(item.cantidad.N),
    estado: item.estado.S,
    fecha: item.fecha.S
  };
}

export const handler = async (event) => {
  try {
    console.log("Evento recibido:", JSON.stringify(event));

    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.rawPath || event.path || "/";
    const id = event.pathParameters?.id;

    if (method === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "CORS OK"
        })
      };
    }

    if (method === "GET" && path === "/") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          mensaje: "Backend serverless de pedidos de videojuegos funcionando correctamente",
          rutas: {
            listarPedidos: "GET /pedidos",
            buscarPedido: "GET /pedidos/{id}",
            crearPedido: "POST /pedidos"
          }
        })
      };
    }

    if (method === "GET" && path === "/pedidos") {
      const command = new ScanCommand({
        TableName: TABLE_NAME
      });

      const response = await client.send(command);

      const pedidos = (response.Items || []).map(convertirItemDynamoDB);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(pedidos)
      };
    }

    if (method === "GET" && id) {
      const command = new GetItemCommand({
        TableName: TABLE_NAME,
        Key: {
          id: { S: id }
        }
      });

      const response = await client.send(command);

      if (!response.Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: "Pedido no encontrado"
          })
        };
      }

      const pedido = convertirItemDynamoDB(response.Item);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(pedido)
      };
    }

    if (method === "POST" && path === "/pedidos") {
      const body = JSON.parse(event.body || "{}");

      const error = validarPedido(body);

      if (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error })
        };
      }

      const nuevoPedido = crearPedido(body);

      const command = new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          id: { S: nuevoPedido.id },
          jugador: { S: nuevoPedido.jugador },
          videojuego: { S: nuevoPedido.videojuego },
          plataforma: { S: nuevoPedido.plataforma },
          cantidad: { N: nuevoPedido.cantidad.toString() },
          estado: { S: nuevoPedido.estado },
          fecha: { S: nuevoPedido.fecha }
        }
      });

      await client.send(command);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          mensaje: "Pedido de videojuego registrado correctamente",
          pedido: nuevoPedido
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: "Ruta no encontrada"
      })
    };

  } catch (error) {
    console.error("Error en Lambda:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Error interno en la función Lambda",
        detalle: error.message
      })
    };
  }
};
