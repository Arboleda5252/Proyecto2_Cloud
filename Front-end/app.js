const API_URL = "http://localhost:3000";

const formulario = document.getElementById("formulario-pedido");
const listaPedidos = document.getElementById("lista-pedidos");
const mensaje = document.getElementById("mensaje");
const btnRecargar = document.getElementById("btn-recargar");

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
}

function formatoFecha(fecha) {
  return new Date(fecha).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function pintarPedidos(pedidos) {
  listaPedidos.innerHTML = "";

  if (pedidos.length === 0) {
    listaPedidos.innerHTML = '<p class="vacio">Todavia no hay pedidos registrados.</p>';
    return;
  }

  pedidos.forEach((pedido) => {
    const item = document.createElement("article");
    item.className = "pedido";

    item.innerHTML = `
      <div>
        <h3>${pedido.videojuego}</h3>
        <p><strong>Jugador:</strong> ${pedido.jugador}</p>
        <p><strong>Plataforma:</strong> ${pedido.plataforma}</p>
        <p><strong>Cantidad:</strong> ${pedido.cantidad}</p>
        <p><strong>Fecha:</strong> ${formatoFecha(pedido.fecha)}</p>
      </div>
      <span class="estado">${pedido.estado}</span>
    `;

    listaPedidos.appendChild(item);
  });
}

async function cargarPedidos() {
  try {
    const respuesta = await fetch(`${API_URL}/pedidos`);
    const pedidos = await respuesta.json();
    pintarPedidos(pedidos);
  } catch (error) {
    listaPedidos.innerHTML = '<p class="vacio">No se pudo conectar con el backend.</p>';
  }
}

async function guardarPedido(evento) {
  evento.preventDefault();

  const pedido = {
    jugador: document.getElementById("jugador").value.trim(),
    videojuego: document.getElementById("videojuego").value.trim(),
    plataforma: document.getElementById("plataforma").value,
    cantidad: Number(document.getElementById("cantidad").value)
  };

  try {
    const respuesta = await fetch(`${API_URL}/pedidos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pedido)
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensaje(resultado.error || "No se pudo guardar el pedido.", "error");
      return;
    }

    formulario.reset();
    document.getElementById("cantidad").value = 1;
    mostrarMensaje(resultado.mensaje, "ok");
    cargarPedidos();
  } catch (error) {
    mostrarMensaje("No se pudo conectar con el backend.", "error");
  }
}

formulario.addEventListener("submit", guardarPedido);
btnRecargar.addEventListener("click", cargarPedidos);

cargarPedidos();
